// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MEVDetectorAggregator
 * @notice Main aggregator contract that ties together all MEV detection services
 * @dev Provides a unified interface for all MEV detection and prevention features
 */
contract MEVDetectorAggregator is Ownable, ReentrancyGuard {
    
    struct ServiceConfig {
        address serviceAddress;
        bool isActive;
        uint256 weight;
        string serviceName;
    }
    
    struct MEVAlert {
        uint256 id;
        address detector;
        string alertType;
        address victim;
        address attacker;
        uint256 severity;
        uint256 timestamp;
        bool resolved;
    }
    
    // Service addresses
    address public mevDetectorV1;
    address public mevDetectorV2;
    address public flashbotsRelay;
    address public mempoolMonitor;
    address public rewardsDistribution;
    address public mevStaking;
    address public protectionRegistry;
    
    // State variables
    uint256 public alertCounter;
    uint256 public totalDetections;
    uint256 public serviceFee;
    uint256 public constant SEVERITY_CRITICAL = 4;
    uint256 public constant SEVERITY_HIGH = 3;
    uint256 public constant SEVERITY_MEDIUM = 2;
    uint256 public constant SEVERITY_LOW = 1;
    
    mapping(uint256 => MEVAlert) public alerts;
    mapping(address => ServiceConfig) public services;
    mapping(address => uint256[]) public userAlerts;
    mapping(address => bool) public authorizedDetectors;
    mapping(string => uint256) public alertTypeCounts;
    
    // Events
    event MEVAlertCreated(
        uint256 indexed alertId,
        string alertType,
        address indexed victim,
        address indexed attacker,
        uint256 severity,
        uint256 timestamp
    );
    
    event AlertResolved(
        uint256 indexed alertId,
        address resolver,
        uint256 timestamp
    );
    
    event ServiceRegistered(
        address indexed service,
        string serviceName,
        uint256 weight
    );
    
    event DetectorAuthorized(address indexed detector, bool authorized);
    event ServiceFeeUpdated(uint256 newFee);
    
    modifier onlyAuthorized() {
        require(authorizedDetectors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor(uint256 _serviceFee) Ownable(msg.sender) {
        serviceFee = _serviceFee;
        authorizedDetectors[msg.sender] = true;
    }
    
    /**
     * @notice Set service addresses
     */
    function setServiceAddresses(
        address _mevDetectorV1,
        address _mevDetectorV2,
        address _flashbotsRelay,
        address _mempoolMonitor,
        address _rewardsDistribution,
        address _mevStaking,
        address _protectionRegistry
    ) external onlyOwner {
        mevDetectorV1 = _mevDetectorV1;
        mevDetectorV2 = _mevDetectorV2;
        flashbotsRelay = _flashbotsRelay;
        mempoolMonitor = _mempoolMonitor;
        rewardsDistribution = _rewardsDistribution;
        mevStaking = _mevStaking;
        protectionRegistry = _protectionRegistry;
    }
    
    /**
     * @notice Register an MEV alert
     * @param detector Detector contract address
     * @param alertType Type of alert
     * @param victim Victim address
     * @param attacker Attacker address
     * @param severity Alert severity
     */
    function registerAlert(
        address detector,
        string calldata alertType,
        address victim,
        address attacker,
        uint256 severity
    ) external onlyAuthorized returns (uint256) {
        require(severity >= SEVERITY_LOW && severity <= SEVERITY_CRITICAL, "Invalid severity");
        
        alertCounter++;
        
        alerts[alertCounter] = MEVAlert({
            id: alertCounter,
            detector: detector,
            alertType: alertType,
            victim: victim,
            attacker: attacker,
            severity: severity,
            timestamp: block.timestamp,
            resolved: false
        });
        
        totalDetections++;
        alertTypeCounts[alertType]++;
        
        if (victim != address(0)) {
            userAlerts[victim].push(alertCounter);
        }
        
        emit MEVAlertCreated(
            alertCounter,
            alertType,
            victim,
            attacker,
            severity,
            block.timestamp
        );
        
        return alertCounter;
    }
    
    /**
     * @notice Resolve an alert
     * @param alertId Alert ID
     */
    function resolveAlert(uint256 alertId) external onlyAuthorized {
        require(alertId > 0 && alertId <= alertCounter, "Invalid alert ID");
        require(!alerts[alertId].resolved, "Already resolved");
        
        alerts[alertId].resolved = true;
        
        emit AlertResolved(alertId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Register a service
     * @param service Service address
     * @param serviceName Service name
     * @param weight Service weight
     */
    function registerService(
        address service,
        string calldata serviceName,
        uint256 weight
    ) external onlyOwner {
        require(service != address(0), "Invalid address");
        require(bytes(serviceName).length > 0, "Name required");
        require(weight > 0, "Weight must be positive");
        
        services[service] = ServiceConfig({
            serviceAddress: service,
            isActive: true,
            weight: weight,
            serviceName: serviceName
        });
        
        emit ServiceRegistered(service, serviceName, weight);
    }
    
    /**
     * @notice Get user's alerts
     * @param user User address
     * @param offset Pagination offset
     * @param limit Pagination limit
     */
    function getUserAlerts(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (MEVAlert[] memory) {
        uint256[] memory alertIds = userAlerts[user];
        uint256 count = 0;
        
        for (uint256 i = offset; i < alertIds.length && count < limit; i++) {
            if (alertIds[i] > 0) {
                count++;
            }
        }
        
        MEVAlert[] memory result = new MEVAlert[](count);
        uint256 index = 0;
        
        for (uint256 i = offset; i < alertIds.length && index < count; i++) {
            if (alertIds[i] > 0) {
                result[index] = alerts[alertIds[i]];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Get alert statistics
     */
    function getAlertStats() external view returns (
        uint256 totalAlerts,
        uint256 activeAlerts,
        uint256 resolvedAlerts,
        uint256 criticalAlerts,
        uint256 highAlerts
    ) {
        totalAlerts = alertCounter;
        
        for (uint256 i = 1; i <= alertCounter; i++) {
            if (alerts[i].resolved) {
                resolvedAlerts++;
            } else {
                activeAlerts++;
            }
            
            if (alerts[i].severity == SEVERITY_CRITICAL) {
                criticalAlerts++;
            } else if (alerts[i].severity == SEVERITY_HIGH) {
                highAlerts++;
            }
        }
    }
    
    /**
     * @notice Get alert type counts
     * @param alertType Alert type
     */
    function getAlertTypeCount(string calldata alertType) external view returns (uint256) {
        return alertTypeCounts[alertType];
    }
    
    /**
     * @notice Authorize or deauthorize a detector
     * @param detector Detector address
     * @param authorized Authorization status
     */
    function setDetectorAuthorization(
        address detector,
        bool authorized
    ) external onlyOwner {
        require(detector != address(0), "Invalid address");
        authorizedDetectors[detector] = authorized;
        
        emit DetectorAuthorized(detector, authorized);
    }
    
    /**
     * @notice Update service fee
     * @param newFee New service fee
     */
    function setServiceFee(uint256 newFee) external onlyOwner {
        serviceFee = newFee;
        
        emit ServiceFeeUpdated(newFee);
    }
    
    /**
     * @notice Get all service addresses
     */
    function getServiceAddresses() external view returns (
        address v1,
        address v2,
        address flashbots,
        address mempool,
        address rewards,
        address staking,
        address registry
    ) {
        return (
            mevDetectorV1,
            mevDetectorV2,
            flashbotsRelay,
            mempoolMonitor,
            rewardsDistribution,
            mevStaking,
            protectionRegistry
        );
    }
    
    /**
     * @notice Withdraw accumulated fees
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }
    
    /**
     * @notice Receive function to accept ETH
     */
    receive() external payable {}
}
