// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RewardsDistribution
 * @notice Contract for managing rewards distribution to MEV reporters and community members
 * @dev Implements fair reward distribution based on contribution and reputation
 */
contract RewardsDistribution is Ownable, ReentrancyGuard {
    
    struct RewardPool {
        uint256 totalRewards;
        uint256 distributedRewards;
        uint256 remainingRewards;
        uint256 contributors;
    }
    
    struct Contributor {
        uint256 reputation;
        uint256 totalRewards;
        uint256 claimedRewards;
        uint256 pendingRewards;
        uint256 reportsSubmitted;
        uint256 verifiedReports;
        uint256 lastRewardTimestamp;
        bool isActive;
    }
    
    struct RewardClaim {
        address claimant;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
        string reason;
    }
    
    // State variables
    IERC20 public rewardToken;
    uint256 public rewardPoolId;
    uint256 public minimumReputation = 10;
    uint256 public rewardMultiplier = 100; // 1x base multiplier
    uint256 public claimPeriod = 30 days;
    
    mapping(uint256 => RewardPool) public rewardPools;
    mapping(address => Contributor) public contributors;
    mapping(uint256 => RewardClaim[]) public poolClaims;
    mapping(address => bool) public authorizedDistributors;
    
    // Events
    event RewardPoolCreated(
        uint256 indexed poolId,
        uint256 amount,
        uint256 timestamp
    );
    
    event RewardsAllocated(
        address indexed contributor,
        uint256 indexed poolId,
        uint256 amount,
        uint256 reputation
    );
    
    event RewardsClaimed(
        address indexed contributor,
        uint256 indexed poolId,
        uint256 amount
    );
    
    event ReputationUpdated(
        address indexed contributor,
        uint256 oldReputation,
        uint256 newReputation
    );
    
    event DistributorAuthorized(address indexed distributor, bool authorized);
    
    modifier onlyAuthorized() {
        require(authorizedDistributors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier hasMinimumReputation() {
        require(contributors[msg.sender].reputation >= minimumReputation, "Insufficient reputation");
        _;
    }
    
    constructor(address _rewardToken) Ownable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
        authorizedDistributors[msg.sender] = true;
    }
    
    /**
     * @notice Create a new reward pool
     * @param amount Amount of tokens to add to the pool
     */
    function createRewardPool(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Invalid amount");
        
        rewardPoolId++;
        
        bool success = rewardToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");
        
        rewardPools[rewardPoolId] = RewardPool({
            totalRewards: amount,
            distributedRewards: 0,
            remainingRewards: amount,
            contributors: 0
        });
        
        emit RewardPoolCreated(rewardPoolId, amount, block.timestamp);
    }
    
    /**
     * @notice Allocate rewards to a contributor
     * @param poolId Reward pool ID
     * @param contributor Contributor address
     * @param amount Reward amount
     * @param reason Reason for reward
     */
    function allocateRewards(
        uint256 poolId,
        address contributor,
        uint256 amount,
        string calldata reason
    ) external onlyAuthorized {
        require(poolId > 0 && poolId <= rewardPoolId, "Invalid pool ID");
        require(contributor != address(0), "Invalid address");
        require(amount > 0, "Invalid amount");
        require(amount <= rewardPools[poolId].remainingRewards, "Insufficient pool balance");
        
        RewardPool storage pool = rewardPools[poolId];
        Contributor storage cont = contributors[contributor];
        
        pool.distributedRewards += amount;
        pool.remainingRewards -= amount;
        
        if (cont.pendingRewards == 0) {
            pool.contributors++;
        }
        
        cont.pendingRewards += amount;
        cont.lastRewardTimestamp = block.timestamp;
        cont.isActive = true;
        
        poolClaims[poolId].push(RewardClaim({
            claimant: contributor,
            amount: amount,
            timestamp: block.timestamp,
            claimed: false,
            reason: reason
        }));
        
        emit RewardsAllocated(contributor, poolId, amount, cont.reputation);
    }
    
    /**
     * @notice Claim pending rewards from a pool
     * @param poolId Reward pool ID
     */
    function claimRewards(uint256 poolId) external nonReentrant hasMinimumReputation {
        require(poolId > 0 && poolId <= rewardPoolId, "Invalid pool ID");
        require(contributors[msg.sender].pendingRewards > 0, "No pending rewards");
        
        Contributor storage cont = contributors[msg.sender];
        uint256 amount = cont.pendingRewards;
        
        cont.pendingRewards = 0;
        cont.claimedRewards += amount;
        cont.totalRewards += amount;
        
        bool success = rewardToken.transfer(msg.sender, amount);
        require(success, "Token transfer failed");
        
        // Mark claims as claimed
        RewardClaim[] storage claims = poolClaims[poolId];
        for (uint256 i = 0; i < claims.length; i++) {
            if (claims[i].claimant == msg.sender && !claims[i].claimed) {
                claims[i].claimed = true;
                break;
            }
        }
        
        emit RewardsClaimed(msg.sender, poolId, amount);
    }
    
    /**
     * @notice Update contributor reputation
     * @param contributor Contributor address
     * @param reputationChange Change in reputation (positive or negative)
     */
    function updateReputation(
        address contributor,
        int256 reputationChange
    ) external onlyAuthorized {
        require(contributor != address(0), "Invalid address");
        
        Contributor storage cont = contributors[contributor];
        uint256 oldReputation = cont.reputation;
        
        if (reputationChange > 0) {
            cont.reputation += uint256(reputationChange);
        } else {
            uint256 decrease = uint256(-reputationChange);
            require(cont.reputation >= decrease, "Insufficient reputation");
            cont.reputation -= decrease;
        }
        
        emit ReputationUpdated(contributor, oldReputation, cont.reputation);
    }
    
    /**
     * @notice Record a verified report for a contributor
     * @param contributor Contributor address
     */
    function recordVerifiedReport(address contributor) external onlyAuthorized {
        require(contributor != address(0), "Invalid address");
        
        Contributor storage cont = contributors[contributor];
        cont.reportsSubmitted++;
        cont.verifiedReports++;
        cont.isActive = true;
        
        // Bonus reputation for verified reports
        updateReputation(contributor, 5);
    }
    
    /**
     * @notice Get contributor details
     * @param contributor Contributor address
     */
    function getContributorDetails(address contributor) external view returns (
        uint256 reputation,
        uint256 totalRewards,
        uint256 claimedRewards,
        uint256 pendingRewards,
        uint256 reportsSubmitted,
        uint256 verifiedReports,
        bool isActive
    ) {
        Contributor storage cont = contributors[contributor];
        return (
            cont.reputation,
            cont.totalRewards,
            cont.claimedRewards,
            cont.pendingRewards,
            cont.reportsSubmitted,
            cont.verifiedReports,
            cont.isActive
        );
    }
    
    /**
     * @notice Get reward pool details
     * @param poolId Pool ID
     */
    function getPoolDetails(uint256 poolId) external view returns (
        uint256 totalRewards,
        uint256 distributedRewards,
        uint256 remainingRewards,
        uint256 contributors
    ) {
        require(poolId > 0 && poolId <= rewardPoolId, "Invalid pool ID");
        
        RewardPool storage pool = rewardPools[poolId];
        return (
            pool.totalRewards,
            pool.distributedRewards,
            pool.remainingRewards,
            pool.contributors
        );
    }
    
    /**
     * @notice Set minimum reputation requirement
     * @param newMinimum New minimum reputation
     */
    function setMinimumReputation(uint256 newMinimum) external onlyOwner {
        minimumReputation = newMinimum;
    }
    
    /**
     * @notice Set reward multiplier
     * @param newMultiplier New reward multiplier (in basis points)
     */
    function setRewardMultiplier(uint256 newMultiplier) external onlyOwner {
        require(newMultiplier > 0, "Invalid multiplier");
        rewardMultiplier = newMultiplier;
    }
    
    /**
     * @notice Authorize or deauthorize a distributor
     * @param distributor Distributor address
     * @param authorized Authorization status
     */
    function setDistributorAuthorization(
        address distributor,
        bool authorized
    ) external onlyOwner {
        require(distributor != address(0), "Invalid address");
        authorizedDistributors[distributor] = authorized;
        
        emit DistributorAuthorized(distributor, authorized);
    }
    
    /**
     * @notice Withdraw tokens from the contract (emergency only)
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(token != address(0), "Invalid token address");
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @notice Calculate reward based on reputation and contribution
     * @param reputation Contributor reputation
     * @param baseReward Base reward amount
     */
    function calculateReward(
        uint256 reputation,
        uint256 baseReward
    ) public pure returns (uint256) {
        // Reputation bonus: up to 2x for high reputation
        uint256 reputationBonus = (reputation * 100) / 1000; // 10% per 100 reputation
        if (reputationBonus > 100) {
            reputationBonus = 100;
        }
        
        uint256 multiplier = 100 + reputationBonus;
        return (baseReward * multiplier) / 100;
    }
}
