// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MEVDToken
 * @dev Governance token for MEV Detector DAO
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MEVDToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    
    // Distribution percentages (in basis points)
    uint256 public constant COMMUNITY_REWARDS = 4000; // 40%
    uint256 public constant TEAM = 2500; // 25%
    uint256 public constant INVESTORS = 2000; // 20%
    uint256 public constant ECOSYSTEM = 1000; // 10%
    uint256 public constant ADVISORS = 500; // 5%
    
    // Vesting schedules
    mapping(address => uint256) public vestingStart;
    mapping(address => uint256) public vestingDuration;
    mapping(address => uint256) public vestedAmount;
    mapping(address => uint256) public claimedAmount;
    
    // Staking pool
    mapping(address => uint256) public stakedBalance;
    uint256 public totalStaked;
    uint256 public stakingAPY = 15; // 15% APY
    
    event TokensVested(address indexed user, uint256 amount);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor() ERC20("MEV Detector Token", "MEVD") ERC20Permit("MEV Detector Token") Ownable(msg.sender) {
        _mint(address(this), TOTAL_SUPPLY);
        
        // Transfer to distribution wallets
        // These would be multi-sig wallets in production
        address communityWallet = address(0x1);
        address teamWallet = address(0x2);
        address investorsWallet = address(0x3);
        address ecosystemWallet = address(0x4);
        address advisorsWallet = address(0x5);
        
        _transfer(address(this), communityWallet, (TOTAL_SUPPLY * COMMUNITY_REWARDS) / 10000);
        _transfer(address(this), teamWallet, (TOTAL_SUPPLY * TEAM) / 10000);
        _transfer(address(this), investorsWallet, (TOTAL_SUPPLY * INVESTORS) / 10000);
        _transfer(address(this), ecosystemWallet, (TOTAL_SUPPLY * ECOSYSTEM) / 10000);
        _transfer(address(this), advisorsWallet, (TOTAL_SUPPLY * ADVISORS) / 10000);
        
        // Set up vesting for team and advisors (1 year cliff, 4 years total)
        setupVesting(teamWallet, 365 days, 1460 days);
        setupVesting(advisorsWallet, 365 days, 730 days);
    }
    
    /**
     * @dev Setup vesting schedule
     */
    function setupVesting(address user, uint256 startDelay, uint256 duration) public onlyOwner {
        vestingStart[user] = block.timestamp + startDelay;
        vestingDuration[user] = duration;
        vestedAmount[user] = balanceOf(user);
    }
    
    /**
     * @dev Claim vested tokens
     */
    function claimVested() public {
        require(vestingStart[msg.sender] > 0, "No vesting schedule");
        require(block.timestamp >= vestingStart[msg.sender], "Cliff period not over");
        
        uint256 totalVested = vestedAmount[msg.sender];
        uint256 timePassed = block.timestamp - vestingStart[msg.sender];
        uint256 vested = (totalVested * timePassed) / vestingDuration[msg.sender];
        uint256 claimable = vested - claimedAmount[msg.sender];
        
        require(claimable > 0, "No tokens to claim");
        require(claimable <= balanceOf(address(this)), "Insufficient contract balance");
        
        claimedAmount[msg.sender] += claimable;
        _transfer(address(this), msg.sender, claimable);
        
        emit TokensVested(msg.sender, claimable);
    }
    
    /**
     * @dev Stake tokens for rewards
     */
    function stake(uint256 amount) public {
        require(amount > 0, "Cannot stake 0");
        require(transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        
        emit TokensStaked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 amount) public {
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        
        _transfer(address(this), msg.sender, amount);
        
        emit TokensUnstaked(msg.sender, amount);
    }
    
    /**
     * @dev Calculate staking rewards
     */
    function calculateRewards(address user) public view returns (uint256) {
        uint256 stake = stakedBalance[user];
        if (stake == 0) return 0;
        
        // Simplified reward calculation (would use time-weighted in production)
        return (stake * stakingAPY) / 100;
    }
    
    /**
     * @dev Claim staking rewards
     */
    function claimRewards() public {
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        require(balanceOf(address(this)) >= rewards, "Insufficient rewards pool");
        
        _transfer(address(this), msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    /**
     * @dev Override transfer to prevent transfers during cliff
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
        
        // Prevent team/advisor transfers during cliff
        if (vestingStart[from] > 0 && block.timestamp < vestingStart[from]) {
            require(claimedAmount[from] == 0, "Cannot transfer during cliff");
        }
    }
    
    /**
     * @dev Override balanceOf to account for staking
     */
    function balanceOf(address account) public view override returns (uint256) {
        return super.balanceOf(account) + stakedBalance[account];
    }
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }
    
    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }
    
    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
