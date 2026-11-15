// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MEVStaking
 * @notice Staking contract for MEV Detector ecosystem
 * @dev Allows users to stake tokens and earn rewards while participating in MEV detection
 */
contract MEVStaking is Ownable, ReentrancyGuard {
    
    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastRewardClaim;
        uint256 totalRewardsClaimed;
        uint256 lockDuration;
        bool isLocked;
    }
    
    struct StakingPool {
        uint256 totalStaked;
        uint256 rewardRate; // Rewards per second
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
        uint256 minimumStake;
        uint256 lockPeriod;
        bool isActive;
    }
    
    struct RewardSnapshot {
        uint256 rewardPerToken;
        uint256 rewards;
    }
    
    // State variables
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    uint256 public poolCount;
    uint256 public totalValueLocked;
    uint256 public constant REWARD_PRECISION = 1e18;
    
    mapping(uint256 => StakingPool) public pools;
    mapping(address => mapping(uint256 => StakeInfo)) public stakes;
    mapping(address => mapping(uint256 => RewardSnapshot)) public userRewardSnapshots;
    mapping(address => bool) public authorizedOperators;
    
    // Events
    event Staked(
        address indexed user,
        uint256 indexed poolId,
        uint256 amount,
        uint256 timestamp
    );
    
    event Withdrawn(
        address indexed user,
        uint256 indexed poolId,
        uint256 amount,
        uint256 timestamp
    );
    
    event RewardClaimed(
        address indexed user,
        uint256 indexed poolId,
        uint256 reward,
        uint256 timestamp
    );
    
    event PoolCreated(
        uint256 indexed poolId,
        uint256 rewardRate,
        uint256 minimumStake,
        uint256 lockPeriod
    );
    
    event PoolUpdated(
        uint256 indexed poolId,
        uint256 newRewardRate
    );
    
    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier validPool(uint256 poolId) {
        require(poolId > 0 && poolId <= poolCount, "Invalid pool");
        require(pools[poolId].isActive, "Pool not active");
        _;
    }
    
    constructor(
        address _stakingToken,
        address _rewardToken
    ) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        authorizedOperators[msg.sender] = true;
    }
    
    /**
     * @notice Create a new staking pool
     * @param rewardRate Reward rate per second
     * @param minimumStake Minimum stake amount
     * @param lockPeriod Lock period in seconds
     */
    function createPool(
        uint256 rewardRate,
        uint256 minimumStake,
        uint256 lockPeriod
    ) external onlyOwner {
        require(rewardRate > 0, "Invalid reward rate");
        require(minimumStake > 0, "Invalid minimum stake");
        
        poolCount++;
        
        pools[poolCount] = StakingPool({
            totalStaked: 0,
            rewardRate: rewardRate,
            lastUpdateTime: block.timestamp,
            rewardPerTokenStored: 0,
            minimumStake: minimumStake,
            lockPeriod: lockPeriod,
            isActive: true
        });
        
        emit PoolCreated(poolCount, rewardRate, minimumStake, lockPeriod);
    }
    
    /**
     * @notice Stake tokens in a pool
     * @param poolId Pool ID
     * @param amount Amount to stake
     */
    function stake(
        uint256 poolId,
        uint256 amount
    ) external nonReentrant validPool(poolId) {
        require(amount >= pools[poolId].minimumStake, "Below minimum stake");
        require(!stakes[msg.sender][poolId].isLocked || block.timestamp >= stakes[msg.sender][poolId].stakedAt + stakes[msg.sender][poolId].lockDuration, "Tokens are locked");
        
        _updatePool(poolId);
        
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        
        // Claim pending rewards before staking more
        if (userStake.amount > 0) {
            uint256 pending = _calculatePendingReward(msg.sender, poolId);
            if (pending > 0) {
                _claimReward(msg.sender, poolId, pending);
            }
        }
        
        bool success = stakingToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
        
        userStake.amount += amount;
        userStake.stakedAt = block.timestamp;
        userStake.lockDuration = pools[poolId].lockPeriod;
        userStake.isLocked = pools[poolId].lockPeriod > 0;
        
        pools[poolId].totalStaked += amount;
        totalValueLocked += amount;
        
        // Update reward snapshot
        userRewardSnapshots[msg.sender][poolId].rewardPerToken = pools[poolId].rewardPerTokenStored;
        
        emit Staked(msg.sender, poolId, amount, block.timestamp);
    }
    
    /**
     * @notice Withdraw staked tokens
     * @param poolId Pool ID
     * @param amount Amount to withdraw
     */
    function withdraw(
        uint256 poolId,
        uint256 amount
    ) external nonReentrant validPool(poolId) {
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        require(userStake.amount >= amount, "Insufficient balance");
        require(!userStake.isLocked || block.timestamp >= userStake.stakedAt + userStake.lockDuration, "Tokens are locked");
        
        _updatePool(poolId);
        
        // Claim pending rewards before withdrawing
        uint256 pending = _calculatePendingReward(msg.sender, poolId);
        if (pending > 0) {
            _claimReward(msg.sender, poolId, pending);
        }
        
        userStake.amount -= amount;
        pools[poolId].totalStaked -= amount;
        totalValueLocked -= amount;
        
        if (userStake.amount == 0) {
            userStake.isLocked = false;
            userStake.lockDuration = 0;
        }
        
        bool success = stakingToken.transfer(msg.sender, amount);
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, poolId, amount, block.timestamp);
    }
    
    /**
     * @notice Claim pending rewards
     * @param poolId Pool ID
     */
    function claimReward(uint256 poolId) external nonReentrant validPool(poolId) {
        uint256 pending = _calculatePendingReward(msg.sender, poolId);
        require(pending > 0, "No rewards to claim");
        
        _updatePool(poolId);
        _claimReward(msg.sender, poolId, pending);
    }
    
    /**
     * @notice Emergency unstake (with penalty)
     * @param poolId Pool ID
     */
    function emergencyWithdraw(uint256 poolId) external nonReentrant validPool(poolId) {
        StakeInfo storage userStake = stakes[msg.sender][poolId];
        require(userStake.amount > 0, "No stake");
        
        // 10% penalty for early withdrawal
        uint256 penalty = (userStake.amount * 10) / 100;
        uint256 withdrawAmount = userStake.amount - penalty;
        
        // Penalty goes to reward pool
        pools[poolId].totalStaked -= penalty;
        totalValueLocked -= userStake.amount;
        
        userStake.amount = 0;
        userStake.isLocked = false;
        userStake.lockDuration = 0;
        
        bool success = stakingToken.transfer(msg.sender, withdrawAmount);
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, poolId, withdrawAmount, block.timestamp);
    }
    
    /**
     * @notice Calculate pending rewards for a user
     * @param user User address
     * @param poolId Pool ID
     */
    function pendingReward(
        address user,
        uint256 poolId
    ) external view validPool(poolId) returns (uint256) {
        return _calculatePendingReward(user, poolId);
    }
    
    /**
     * @notice Get stake info for a user
     * @param user User address
     * @param poolId Pool ID
     */
    function getStakeInfo(
        address user,
        uint256 poolId
    ) external view returns (
        uint256 amount,
        uint256 stakedAt,
        uint256 lastRewardClaim,
        uint256 totalRewardsClaimed,
        uint256 lockDuration,
        bool isLocked
    ) {
        StakeInfo storage stake = stakes[user][poolId];
        return (
            stake.amount,
            stake.stakedAt,
            stake.lastRewardClaim,
            stake.totalRewardsClaimed,
            stake.lockDuration,
            stake.isLocked
        );
    }
    
    /**
     * @notice Update pool reward rate
     * @param poolId Pool ID
     * @param newRewardRate New reward rate
     */
    function updatePoolRewardRate(
        uint256 poolId,
        uint256 newRewardRate
    ) external onlyOwner validPool(poolId) {
        require(newRewardRate > 0, "Invalid reward rate");
        
        _updatePool(poolId);
        pools[poolId].rewardRate = newRewardRate;
        
        emit PoolUpdated(poolId, newRewardRate);
    }
    
    /**
     * @notice Deposit reward tokens to the contract
     * @param amount Amount of reward tokens
     */
    function depositRewards(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");
        
        bool success = rewardToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Set authorized operator
     * @param operator Operator address
     * @param authorized Authorization status
     */
    function setAuthorizedOperator(
        address operator,
        bool authorized
    ) external onlyOwner {
        require(operator != address(0), "Invalid address");
        authorizedOperators[operator] = authorized;
    }
    
    // Internal functions
    
    function _updatePool(uint256 poolId) internal {
        StakingPool storage pool = pools[poolId];
        
        if (pool.totalStaked == 0) {
            pool.lastUpdateTime = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        uint256 reward = timeElapsed * pool.rewardRate;
        
        pool.rewardPerTokenStored += (reward * REWARD_PRECISION) / pool.totalStaked;
        pool.lastUpdateTime = block.timestamp;
    }
    
    function _calculatePendingReward(
        address user,
        uint256 poolId
    ) internal view returns (uint256) {
        StakingPool storage pool = pools[poolId];
        StakeInfo storage userStake = stakes[user][poolId];
        RewardSnapshot storage snapshot = userRewardSnapshots[user][poolId];
        
        uint256 currentRewardPerToken = pool.rewardPerTokenStored;
        
        if (pool.totalStaked > 0 && pool.lastUpdateTime != block.timestamp) {
            uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
            uint256 reward = timeElapsed * pool.rewardRate;
            currentRewardPerToken += (reward * REWARD_PRECISION) / pool.totalStaked;
        }
        
        uint256 reward = (userStake.amount * (currentRewardPerToken - snapshot.rewardPerToken)) / REWARD_PRECISION;
        return snapshot.rewards + reward;
    }
    
    function _claimReward(
        address user,
        uint256 poolId,
        uint256 amount
    ) internal {
        stakes[user][poolId].lastRewardClaim = block.timestamp;
        stakes[user][poolId].totalRewardsClaimed += amount;
        
        userRewardSnapshots[user][poolId].rewards = 0;
        userRewardSnapshots[user][poolId].rewardPerToken = pools[poolId].rewardPerTokenStored;
        
        bool success = rewardToken.transfer(user, amount);
        require(success, "Reward transfer failed");
        
        emit RewardClaimed(user, poolId, amount, block.timestamp);
    }
}
