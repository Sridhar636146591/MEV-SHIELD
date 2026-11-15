// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MEVDetectorV2
 * @title Advanced MEV Attack Detection and Prevention System
 * @notice This contract detects and prevents various types of MEV attacks
 * including sandwich attacks, front-running, and back-running
 */
contract MEVDetectorV2 {
    
    // Events
    event SandwichAttackDetected(
        address indexed attacker,
        address indexed victim,
        address indexed token,
        uint256 amount,
        uint256 timestamp,
        uint256 severity
    );
    
    event FrontRunningDetected(
        address indexed attacker,
        address indexed victim,
        bytes32 txHash,
        uint256 gasPrice,
        uint256 timestamp
    );
    
    event BackRunningDetected(
        address indexed attacker,
        address indexed victim,
        uint256 blockNumber,
        uint256 profit
    );
    
    event LiquiditySniped(
        address indexed sniper,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event ReportSubmitted(
        address indexed reporter,
        uint256 reportId,
        string reportType,
        uint256 reward
    );
    
    // Structures
    struct MEVReport {
        uint256 id;
        address reporter;
        string attackType;
        address target;
        uint256 timestamp;
        bool verified;
        uint256 reward;
    }
    
    struct TraderProfile {
        uint256 totalMEVExtracted;
        uint256 successfulAttacks;
        uint256 failedAttacks;
        bool isBlacklisted;
        mapping(string => uint256) attackTypeCounts;
    }
    
    struct ProtectionSubscription {
        bool active;
        uint256 expiryTimestamp;
        uint256 protectionLevel;
    }
    
    // State Variables
    uint256 public constant SEVERITY_LOW = 1;
    uint256 public constant SEVERITY_MEDIUM = 2;
    uint256 public constant SEVERITY_HIGH = 3;
    uint256 public constant SEVERITY_CRITICAL = 4;
    
    uint256 public reportCounter;
    uint256 public detectionFee;
    uint256 public rewardPool;
    
    mapping(address => TraderProfile) public traderProfiles;
    mapping(uint256 => MEVReport) public reports;
    mapping(address => ProtectionSubscription) public subscriptions;
    mapping(address => bool) public verifiedProtocols;
    
    address public owner;
    address public treasury;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier activeProtection() {
        require(
            subscriptions[msg.sender].active && 
            block.timestamp < subscriptions[msg.sender].expiryTimestamp,
            "No active protection"
        );
        _;
    }
    
    constructor(uint256 _detectionFee) {
        owner = msg.sender;
        treasury = msg.sender;
        detectionFee = _detectionFee;
        rewardPool = 0;
    }
    
    /**
     * @notice Detect potential sandwich attack
     * @param token The token being traded
     * @param amount Trade amount
     * @param slippage Slippage tolerance
     */
    function detectSandwichAttack(
        address token,
        uint256 amount,
        uint256 slippage
    ) external payable returns (uint256 severity) {
        require(msg.value >= detectionFee, "Insufficient fee");
        
        // Analyze mempool for similar pending transactions
        bool isDetected = _analyzeMempoolPatterns(token, amount);
        
        if (isDetected) {
            severity = _calculateSeverity(amount, slippage);
            
            emit SandwichAttackDetected(
                msg.sender,
                tx.origin,
                token,
                amount,
                block.timestamp,
                severity
            );
            
            _updateTraderProfile(msg.sender, "sandwich", true);
            rewardPool += msg.value / 10; // 10% to reward pool
        }
        
        return severity;
    }
    
    /**
     * @notice Detect front-running attempt
     * @param victimTxHash The victim's transaction hash
     * @param gasPriceUsed Gas price used by attacker
     */
    function detectFrontRunning(
        bytes32 victimTxHash,
        uint256 gasPriceUsed
    ) external returns (bool) {
        // Check if gas price is significantly higher than average
        uint256 avgGasPrice = _getAverageGasPrice();
        
        if (gasPriceUsed > avgGasPrice * 150 / 100) {
            emit FrontRunningDetected(
                msg.sender,
                tx.origin,
                victimTxHash,
                gasPriceUsed,
                block.timestamp
            );
            
            _updateTraderProfile(msg.sender, "frontrun", true);
            return true;
        }
        
        return false;
    }
    
    /**
     * @notice Detect back-running activity
     * @param victim The victim address
     * @param profit Profit extracted by back-runner
     */
    function detectBackRunning(
        address victim,
        uint256 profit
    ) external returns (bool) {
        uint256 threshold = 1 ether; // Minimum profit to be considered significant
        
        if (profit >= threshold) {
            emit BackRunningDetected(
                msg.sender,
                victim,
                block.number,
                profit
            );
            
            _updateTraderProfile(msg.sender, "backrun", true);
            return true;
        }
        
        return false;
    }
    
    /**
     * @notice Subscribe to protection service
     * @param duration Subscription duration in seconds
     * @param level Protection level (1-3)
     */
    function subscribeToProtection(
        uint256 duration,
        uint256 level
    ) external payable {
        require(level >= 1 && level <= 3, "Invalid protection level");
        require(msg.value >= getSubscriptionPrice(level), "Insufficient payment");
        
        subscriptions[msg.sender] = ProtectionSubscription({
            active: true,
            expiryTimestamp: block.timestamp + duration,
            protectionLevel: level
        });
    }
    
    /**
     * @notice Submit MEV attack report for verification
     * @param attackType Type of MEV attack
     * @param target Address of the attacker
     * @param evidence Evidence data
     */
    function submitMEVReport(
        string calldata attackType,
        address target,
        bytes calldata evidence
    ) external activeProtection returns (uint256) {
        reportCounter++;
        
        uint256 reward = _calculateReward(attackType);
        
        reports[reportCounter] = MEVReport({
            id: reportCounter,
            reporter: msg.sender,
            attackType: attackType,
            target: target,
            timestamp: block.timestamp,
            verified: false,
            reward: reward
        });
        
        emit ReportSubmitted(
            msg.sender,
            reportCounter,
            attackType,
            reward
        );
        
        return reportCounter;
    }
    
    /**
     * @notice Verify a submitted report
     * @param reportId The ID of the report to verify
     * @param isValid Whether the report is valid
     */
    function verifyReport(
        uint256 reportId,
        bool isValid
    ) external onlyOwner {
        MEVReport storage report = reports[reportId];
        require(!report.verified, "Already verified");
        
        report.verified = isValid;
        
        if (isValid) {
            // Transfer reward from reward pool
            payable(report.reporter).transfer(report.reward);
            rewardPool -= report.reward;
            
            // Update attacker profile
            traderProfiles[report.target].isBlacklisted = true;
        }
    }
    
    /**
     * @notice Get trader's MEV activity profile
     * @param trader The trader's address
     */
    function getTraderProfile(
        address trader
    ) external view returns (
        uint256 totalMEV,
        uint256 successful,
        uint256 failed,
        bool blacklisted
    ) {
        TraderProfile storage profile = traderProfiles[trader];
        return (
            profile.totalMEVExtracted,
            profile.successfulAttacks,
            profile.failedAttacks,
            profile.isBlacklisted
        );
    }
    
    /**
     * @notice Calculate subscription price based on protection level
     * @param level Protection level (1-3)
     */
    function getSubscriptionPrice(
        uint256 level
    ) public pure returns (uint256) {
        if (level == 1) return 0.1 ether;    // Basic
        if (level == 2) return 0.25 ether;   // Premium
        return 0.5 ether;                     // Enterprise
    }
    
    /**
     * @notice Withdraw funds from treasury
     * @param amount Amount to withdraw
     */
    function withdrawTreasury(
        uint256 amount
    ) external onlyOwner {
        payable(treasury).transfer(amount);
    }
    
    /**
     * @notice Update detection fee
     * @param newFee New detection fee
     */
    function setDetectionFee(
        uint256 newFee
    ) external onlyOwner {
        detectionFee = newFee;
    }
    
    // Internal Functions
    
    function _analyzeMempoolPatterns(
        address token,
        uint256 amount
    ) internal view returns (bool) {
        // In production, this would integrate with mempool monitoring services
        // For now, we simulate detection logic
        return amount > 1 ether; // Simplified logic
    }
    
    function _calculateSeverity(
        uint256 amount,
        uint256 slippage
    ) internal pure returns (uint256) {
        if (amount > 10 ether || slippage > 500) { // 5% slippage
            return SEVERITY_CRITICAL;
        } else if (amount > 5 ether || slippage > 300) {
            return SEVERITY_HIGH;
        } else if (amount > 1 ether || slippage > 100) {
            return SEVERITY_MEDIUM;
        }
        return SEVERITY_LOW;
    }
    
    function _getAverageGasPrice() internal view returns (uint256) {
        // In production, fetch from oracle or calculate from recent blocks
        return 50 gwei; // Placeholder
    }
    
    function _calculateReward(
        string memory attackType
    ) internal pure returns (uint256) {
        if (keccak256(bytes(attackType)) == keccak256(bytes("sandwich"))) {
            return 0.05 ether;
        } else if (keccak256(bytes(attackType)) == keccak256(bytes("frontrun"))) {
            return 0.03 ether;
        } else if (keccak256(bytes(attackType)) == keccak256(bytes("backrun"))) {
            return 0.02 ether;
        }
        return 0.01 ether;
    }
    
    function _updateTraderProfile(
        address trader,
        string memory attackType,
        bool success
    ) internal {
        TraderProfile storage profile = traderProfiles[trader];
        
        if (success) {
            profile.successfulAttacks++;
            profile.totalMEVExtracted += 1 ether; // Simplified
        } else {
            profile.failedAttacks++;
        }
        
        profile.attackTypeCounts[attackType]++;
    }
    
    // Receive function to accept ETH for reward pool
    receive() external payable {
        rewardPool += msg.value;
    }
}
