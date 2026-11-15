// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MEVProtectionRegistry
 * @notice Registry contract for MEV protection services and user preferences
 * @dev Allows users to register for protection and configure their preferences
 */
contract MEVProtectionRegistry is Ownable, ReentrancyGuard {
    
    enum ProtectionLevel {
        None,
        Basic,
        Advanced,
        Enterprise
    }
    
    struct UserProtection {
        ProtectionLevel level;
        uint256 activatedAt;
        uint256 expiresAt;
        bool autoRenew;
        address paymentToken;
    }
    
    struct ProtectionPlan {
        string name;
        uint256 price;
        uint256 duration;
        bool includesFlashbots;
        bool includesMempoolMonitoring;
        bool includesSandwichProtection;
        bool includesPrioritySupport;
        bool isActive;
    }
    
    struct ProtectedAddress {
        address addr;
        string label;
        uint256 addedAt;
        bool isActive;
    }
    
    // State variables
    uint256 public planCount;
    uint256 public registrationFee;
    uint256 public totalProtectedUsers;
    
    mapping(uint256 => ProtectionPlan) public plans;
    mapping(address => UserProtection) public userProtections;
    mapping(address => ProtectedAddress[]) public userProtectedAddresses;
    mapping(address => mapping(address => bool)) public isProtectedAddress;
    mapping(address => bool) public authorizedRegistrars;
    
    // Events
    event ProtectionActivated(
        address indexed user,
        uint256 indexed planId,
        ProtectionLevel level,
        uint256 expiresAt
    );
    
    event ProtectionDeactivated(
        address indexed user,
        uint256 timestamp
    );
    
    event ProtectionAddressAdded(
        address indexed user,
        address indexed protectedAddress,
        string label
    );
    
    event ProtectionAddressRemoved(
        address indexed user,
        address indexed protectedAddress
    );
    
    event PlanCreated(
        uint256 indexed planId,
        string name,
        uint256 price,
        uint256 duration
    );
    
    event RegistrarAuthorized(address indexed registrar, bool authorized);
    
    modifier onlyAuthorized() {
        require(authorizedRegistrars[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier hasActiveProtection() {
        require(
            userProtections[msg.sender].level != ProtectionLevel.None &&
            block.timestamp < userProtections[msg.sender].expiresAt,
            "No active protection"
        );
        _;
    }
    
    constructor(uint256 _registrationFee) Ownable(msg.sender) {
        registrationFee = _registrationFee;
        authorizedRegistrars[msg.sender] = true;
        
        // Create default plans
        _createDefaultPlans();
    }
    
    /**
     * @notice Activate protection plan
     * @param planId Plan ID
     */
    function activateProtection(uint256 planId) external payable nonReentrant {
        require(planId > 0 && planId <= planCount, "Invalid plan");
        require(plans[planId].isActive, "Plan not active");
        
        ProtectionPlan storage plan = plans[planId];
        require(msg.value >= plan.price, "Insufficient payment");
        
        ProtectionLevel level = _getProtectionLevelFromPlan(planId);
        uint256 expiry = block.timestamp + plan.duration;
        
        userProtections[msg.sender] = UserProtection({
            level: level,
            activatedAt: block.timestamp,
            expiresAt: expiry,
            autoRenew: false,
            paymentToken: address(0)
        });
        
        totalProtectedUsers++;
        
        emit ProtectionActivated(msg.sender, planId, level, expiry);
    }
    
    /**
     * @notice Deactivate protection
     */
    function deactivateProtection() external {
        require(userProtections[msg.sender].level != ProtectionLevel.None, "No active protection");
        
        userProtections[msg.sender].level = ProtectionLevel.None;
        totalProtectedUsers--;
        
        emit ProtectionDeactivated(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Add address to protection list
     * @param protectedAddress Address to protect
     * @param label Label for the address
     */
    function addProtectedAddress(
        address protectedAddress,
        string calldata label
    ) external hasActiveProtection {
        require(protectedAddress != address(0), "Invalid address");
        require(bytes(label).length > 0, "Label required");
        require(!isProtectedAddress[msg.sender][protectedAddress], "Already added");
        
        userProtectedAddresses[msg.sender].push(ProtectedAddress({
            addr: protectedAddress,
            label: label,
            addedAt: block.timestamp,
            isActive: true
        }));
        
        isProtectedAddress[msg.sender][protectedAddress] = true;
        
        emit ProtectionAddressAdded(msg.sender, protectedAddress, label);
    }
    
    /**
     * @notice Remove address from protection list
     * @param protectedAddress Address to remove
     */
    function removeProtectedAddress(address protectedAddress) external {
        require(isProtectedAddress[msg.sender][protectedAddress], "Not in protection list");
        
        isProtectedAddress[msg.sender][protectedAddress] = false;
        
        ProtectedAddress[] storage addresses = userProtectedAddresses[msg.sender];
        for (uint256 i = 0; i < addresses.length; i++) {
            if (addresses[i].addr == protectedAddress) {
                addresses[i].isActive = false;
                break;
            }
        }
        
        emit ProtectionAddressRemoved(msg.sender, protectedAddress);
    }
    
    /**
     * @notice Create a new protection plan
     * @param name Plan name
     * @param price Plan price
     * @param duration Plan duration
     * @param includesFlashbots Include Flashbots protection
     * @param includesMempoolMonitoring Include mempool monitoring
     * @param includesSandwichProtection Include sandwich protection
     * @param includesPrioritySupport Include priority support
     */
    function createProtectionPlan(
        string calldata name,
        uint256 price,
        uint256 duration,
        bool includesFlashbots,
        bool includesMempoolMonitoring,
        bool includesSandwichProtection,
        bool includesPrioritySupport
    ) external onlyOwner {
        require(bytes(name).length > 0, "Name required");
        require(price > 0, "Price must be positive");
        require(duration > 0, "Duration must be positive");
        
        planCount++;
        
        plans[planCount] = ProtectionPlan({
            name: name,
            price: price,
            duration: duration,
            includesFlashbots: includesFlashbots,
            includesMempoolMonitoring: includesMempoolMonitoring,
            includesSandwichProtection: includesSandwichProtection,
            includesPrioritySupport: includesPrioritySupport,
            isActive: true
        });
        
        emit PlanCreated(planCount, name, price, duration);
    }
    
    /**
     * @notice Enable auto-renew for protection
     * @param enabled Enable or disable
     * @param paymentToken Token address for payment (address(0) for ETH)
     */
    function setAutoRenew(bool enabled, address paymentToken) external hasActiveProtection {
        userProtections[msg.sender].autoRenew = enabled;
        userProtections[msg.sender].paymentToken = paymentToken;
    }
    
    /**
     * @notice Check if user has active protection
     * @param user User address
     */
    function hasProtection(address user) external view returns (
        bool isActive,
        ProtectionLevel level,
        uint256 expiresAt
    ) {
        UserProtection storage protection = userProtections[user];
        bool active = protection.level != ProtectionLevel.None && block.timestamp < protection.expiresAt;
        
        return (active, protection.level, protection.expiresAt);
    }
    
    /**
     * @notice Get user's protected addresses
     * @param user User address
     */
    function getProtectedAddresses(address user) external view returns (
        address[] memory addresses,
        string[] memory labels,
        uint256[] memory addedAts
    ) {
        ProtectedAddress[] storage protectedAddrs = userProtectedAddresses[user];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < protectedAddrs.length; i++) {
            if (protectedAddrs[i].isActive) {
                activeCount++;
            }
        }
        
        addresses = new address[](activeCount);
        labels = new string[](activeCount);
        addedAts = new uint256[](activeCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < protectedAddrs.length && index < activeCount; i++) {
            if (protectedAddrs[i].isActive) {
                addresses[index] = protectedAddrs[i].addr;
                labels[index] = protectedAddrs[i].label;
                addedAts[index] = protectedAddrs[i].addedAt;
                index++;
            }
        }
    }
    
    /**
     * @notice Get protection plan details
     * @param planId Plan ID
     */
    function getPlanDetails(uint256 planId) external view returns (
        string memory name,
        uint256 price,
        uint256 duration,
        bool includesFlashbots,
        bool includesMempoolMonitoring,
        bool includesSandwichProtection,
        bool includesPrioritySupport,
        bool isActive
    ) {
        require(planId > 0 && planId <= planCount, "Invalid plan");
        
        ProtectionPlan storage plan = plans[planId];
        return (
            plan.name,
            plan.price,
            plan.duration,
            plan.includesFlashbots,
            plan.includesMempoolMonitoring,
            plan.includesSandwichProtection,
            plan.includesPrioritySupport,
            plan.isActive
        );
    }
    
    /**
     * @notice Update registration fee
     * @param newFee New registration fee
     */
    function setRegistrationFee(uint256 newFee) external onlyOwner {
        registrationFee = newFee;
    }
    
    /**
     * @notice Set authorized registrar
     * @param registrar Registrar address
     * @param authorized Authorization status
     */
    function setRegistrarAuthorization(
        address registrar,
        bool authorized
    ) external onlyOwner {
        require(registrar != address(0), "Invalid address");
        authorizedRegistrars[registrar] = authorized;
        
        emit RegistrarAuthorized(registrar, authorized);
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
    
    function _createDefaultPlans() internal {
        // Basic Plan
        planCount++;
        plans[planCount] = ProtectionPlan({
            name: "Basic Protection",
            price: 0.05 ether,
            duration: 30 days,
            includesFlashbots: false,
            includesMempoolMonitoring: true,
            includesSandwichProtection: true,
            includesPrioritySupport: false,
            isActive: true
        });
        emit PlanCreated(planCount, "Basic Protection", 0.05 ether, 30 days);
        
        // Advanced Plan
        planCount++;
        plans[planCount] = ProtectionPlan({
            name: "Advanced Protection",
            price: 0.15 ether,
            duration: 30 days,
            includesFlashbots: true,
            includesMempoolMonitoring: true,
            includesSandwichProtection: true,
            includesPrioritySupport: false,
            isActive: true
        });
        emit PlanCreated(planCount, "Advanced Protection", 0.15 ether, 30 days);
        
        // Enterprise Plan
        planCount++;
        plans[planCount] = ProtectionPlan({
            name: "Enterprise Protection",
            price: 0.5 ether,
            duration: 90 days,
            includesFlashbots: true,
            includesMempoolMonitoring: true,
            includesSandwichProtection: true,
            includesPrioritySupport: true,
            isActive: true
        });
        emit PlanCreated(planCount, "Enterprise Protection", 0.5 ether, 90 days);
    }
    
    function _getProtectionLevelFromPlan(uint256 planId) internal pure returns (ProtectionLevel) {
        if (planId == 1) return ProtectionLevel.Basic;
        if (planId == 2) return ProtectionLevel.Advanced;
        return ProtectionLevel.Enterprise;
    }
    
    /**
     * @notice Receive function to accept ETH
     */
    receive() external payable {}
}
