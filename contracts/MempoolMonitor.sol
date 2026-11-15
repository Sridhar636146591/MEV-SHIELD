// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MempoolMonitor
 * @notice Contract for monitoring and analyzing mempool transactions
 * @dev Tracks pending transactions and identifies potential MEV opportunities
 */
contract MempoolMonitor is Ownable, ReentrancyGuard {
    
    struct PendingTransaction {
        bytes32 txHash;
        address from;
        address to;
        uint256 value;
        uint256 gasPrice;
        uint256 gasLimit;
        bytes data;
        uint256 timestamp;
        bool analyzed;
        uint256 riskScore;
    }
    
    struct MEVOpportunity {
        address token;
        string opportunityType; // "arbitrage", "liquidation", "sandwich"
        uint256 estimatedProfit;
        uint256 requiredCapital;
        uint256 confidence;
        uint256 timestamp;
        bool claimed;
    }
    
    struct MonitorSubscription {
        bool active;
        uint256 expiryTimestamp;
        uint256 tier; // 1=Basic, 2=Premium, 3=Enterprise
        uint256 alertsReceived;
    }
    
    // State variables
    uint256 public txCounter;
    uint256 public opportunityCounter;
    uint256 public monitoringFee;
    uint256 public totalTransactionsMonitored;
    
    mapping(uint256 => PendingTransaction) public pendingTransactions;
    mapping(uint256 => MEVOpportunity) public opportunities;
    mapping(address => MonitorSubscription) public subscriptions;
    mapping(address => uint256[]) public userAlerts;
    mapping(address => bool) public authorizedMonitors;
    
    // Thresholds
    uint256 public constant MIN_GAS_PRICE_THRESHOLD = 50 gwei;
    uint256 public constant HIGH_VALUE_THRESHOLD = 10 ether;
    uint256 public constant SUSPICIOUS_GAS_MULTIPLIER = 200; // 2x average
    
    // Events
    event TransactionMonitored(
        uint256 indexed txId,
        bytes32 indexed txHash,
        address indexed from,
        address to,
        uint256 value,
        uint256 riskScore
    );
    
    event MEVOpportunityDetected(
        uint256 indexed opportunityId,
        address indexed token,
        string opportunityType,
        uint256 estimatedProfit,
        uint256 confidence
    );
    
    event AlertSent(
        address indexed subscriber,
        uint256 indexed opportunityId,
        string alertType
    );
    
    event SubscriptionActivated(
        address indexed subscriber,
        uint256 tier,
        uint256 expiryTimestamp
    );
    
    modifier onlyAuthorized() {
        require(authorizedMonitors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier activeSubscription() {
        MonitorSubscription storage sub = subscriptions[msg.sender];
        require(sub.active && block.timestamp < sub.expiryTimestamp, "No active subscription");
        _;
    }
    
    constructor(uint256 _monitoringFee) Ownable(msg.sender) {
        monitoringFee = _monitoringFee;
        authorizedMonitors[msg.sender] = true;
    }
    
    /**
     * @notice Add a pending transaction to monitor
     * @param txHash Transaction hash
     * @param from Sender address
     * @param to Recipient address
     * @param value Transaction value
     * @param gasPrice Gas price
     * @param gasLimit Gas limit
     * @param data Transaction data
     */
    function monitorTransaction(
        bytes32 txHash,
        address from,
        address to,
        uint256 value,
        uint256 gasPrice,
        uint256 gasLimit,
        bytes calldata data
    ) external onlyAuthorized returns (uint256) {
        require(txHash != bytes32(0), "Invalid tx hash");
        require(from != address(0), "Invalid from address");
        
        txCounter++;
        
        uint256 riskScore = _calculateRiskScore(value, gasPrice, gasLimit, data);
        
        pendingTransactions[txCounter] = PendingTransaction({
            txHash: txHash,
            from: from,
            to: to,
            value: value,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            data: data,
            timestamp: block.timestamp,
            analyzed: true,
            riskScore: riskScore
        });
        
        totalTransactionsMonitored++;
        
        emit TransactionMonitored(
            txCounter,
            txHash,
            from,
            to,
            value,
            riskScore
        );
        
        // Check for MEV opportunities
        _detectOpportunities(txCounter, value, gasPrice);
        
        return txCounter;
    }
    
    /**
     * @notice Subscribe to mempool monitoring alerts
     * @param tier Subscription tier (1-3)
     * @param duration Duration in seconds
     */
    function subscribe(uint256 tier, uint256 duration) external payable {
        require(tier >= 1 && tier <= 3, "Invalid tier");
        require(duration > 0, "Invalid duration");
        require(msg.value >= _getSubscriptionPrice(tier), "Insufficient payment");
        
        subscriptions[msg.sender] = MonitorSubscription({
            active: true,
            expiryTimestamp: block.timestamp + duration,
            tier: tier,
            alertsReceived: 0
        });
        
        emit SubscriptionActivated(msg.sender, tier, block.timestamp + duration);
    }
    
    /**
     * @notice Claim an MEV opportunity
     * @param opportunityId Opportunity ID
     */
    function claimOpportunity(uint256 opportunityId) external activeSubscription {
        require(opportunityId > 0 && opportunityId <= opportunityCounter, "Invalid opportunity");
        
        MEVOpportunity storage opp = opportunities[opportunityId];
        require(!opp.claimed, "Already claimed");
        
        opp.claimed = true;
        subscriptions[msg.sender].alertsReceived++;
        
        emit AlertSent(msg.sender, opportunityId, opp.opportunityType);
    }
    
    /**
     * @notice Get risk assessment for a transaction
     * @param txId Transaction ID
     */
    function getRiskAssessment(uint256 txId) external view returns (
        uint256 riskScore,
        string memory riskLevel,
        string memory recommendation
    ) {
        require(txId > 0 && txId <= txCounter, "Invalid transaction ID");
        
        PendingTransaction storage tx = pendingTransactions[txId];
        riskScore = tx.riskScore;
        
        if (riskScore > 70) {
            riskLevel = "Critical";
            recommendation = "Use private relay or cancel transaction";
        } else if (riskScore > 50) {
            riskLevel = "High";
            recommendation = "Consider reducing slippage tolerance";
        } else if (riskScore > 30) {
            riskLevel = "Medium";
            recommendation = "Monitor closely before execution";
        } else {
            riskLevel = "Low";
            recommendation = "Safe to proceed with standard settings";
        }
    }
    
    /**
     * @notice Get active MEV opportunities
     * @param offset Pagination offset
     * @param limit Pagination limit
     */
    function getActiveOpportunities(
        uint256 offset,
        uint256 limit
    ) external view returns (MEVOpportunity[] memory) {
        uint256 count = 0;
        
        // Count active opportunities
        for (uint256 i = 1; i <= opportunityCounter && count < limit; i++) {
            if (!opportunities[i].claimed) {
                count++;
            }
        }
        
        MEVOpportunity[] memory result = new MEVOpportunity[](count);
        uint256 index = 0;
        
        for (uint256 i = offset; i <= opportunityCounter && index < count; i++) {
            if (!opportunities[i].claimed) {
                result[index] = opportunities[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Update monitoring fee
     * @param newFee New monitoring fee
     */
    function setMonitoringFee(uint256 newFee) external onlyOwner {
        monitoringFee = newFee;
    }
    
    /**
     * @notice Authorize or deauthorize a monitor
     * @param monitor Monitor address
     * @param authorized Authorization status
     */
    function setMonitorAuthorization(
        address monitor,
        bool authorized
    ) external onlyOwner {
        require(monitor != address(0), "Invalid address");
        authorizedMonitors[monitor] = authorized;
    }
    
    /**
     * @notice Withdraw accumulated fees
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }
    
    // Internal functions
    
    function _calculateRiskScore(
        uint256 value,
        uint256 gasPrice,
        uint256 gasLimit,
        bytes memory data
    ) internal pure returns (uint256) {
        uint256 score = 20; // Base score
        
        // Value-based risk (0-30)
        if (value > HIGH_VALUE_THRESHOLD) {
            score += 30;
        } else if (value > 1 ether) {
            score += 20;
        } else if (value > 0.1 ether) {
            score += 10;
        }
        
        // Gas price risk (0-30)
        if (gasPrice > MIN_GAS_PRICE_THRESHOLD * SUSPICIOUS_GAS_MULTIPLIER / 100) {
            score += 30;
        } else if (gasPrice > MIN_GAS_PRICE_THRESHOLD) {
            score += 15;
        }
        
        // Data complexity risk (0-20)
        if (data.length > 1000) {
            score += 20;
        } else if (data.length > 500) {
            score += 10;
        }
        
        return score > 100 ? 100 : score;
    }
    
    function _detectOpportunities(
        uint256 txId,
        uint256 value,
        uint256 gasPrice
    ) internal {
        // Simulated opportunity detection
        // In production, this would use off-chain analysis
        
        if (value > HIGH_VALUE_THRESHOLD) {
            opportunityCounter++;
            opportunities[opportunityCounter] = MEVOpportunity({
                token: address(0),
                opportunityType: "liquidation",
                estimatedProfit: value / 100, // 1% profit estimate
                requiredCapital: value / 10,
                confidence: 75,
                timestamp: block.timestamp,
                claimed: false
            });
            
            emit MEVOpportunityDetected(
                opportunityCounter,
                address(0),
                "liquidation",
                value / 100,
                75
            );
        }
    }
    
    function _getSubscriptionPrice(uint256 tier) internal pure returns (uint256) {
        if (tier == 1) return 0.05 ether;
        if (tier == 2) return 0.15 ether;
        return 0.5 ether;
    }
    
    /**
     * @notice Receive function to accept ETH
     */
    receive() external payable {}
}
