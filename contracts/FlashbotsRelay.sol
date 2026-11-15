// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlashbotsRelay
 * @notice Contract for managing Flashbots private transaction relay integration
 * @dev Allows users to submit transactions privately to avoid MEV attacks
 */
contract FlashbotsRelay is ReentrancyGuard, Ownable {
    
    struct RelayRequest {
        bytes txData;
        address target;
        uint256 value;
        uint256 gasLimit;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        uint256 timestamp;
        bool executed;
        address submitter;
    }
    
    struct BundleSubmission {
        address submitter;
        bytes[] transactions;
        address[] targets;
        uint256[] values;
        uint256 blockNumber;
        uint256 timestamp;
        bool included;
    }
    
    // State variables
    uint256 public requestCounter;
    uint256 public bundleCounter;
    uint256 public relayFee;
    uint256 public totalRelayed;
    
    mapping(uint256 => RelayRequest) public relayRequests;
    mapping(uint256 => BundleSubmission) public bundles;
    mapping(address => uint256[]) public userRequests;
    mapping(address => bool) public authorizedRelayers;
    
    // Events
    event RelayRequestCreated(
        uint256 indexed requestId,
        address indexed submitter,
        address indexed target,
        uint256 value,
        uint256 timestamp
    );
    
    event BundleSubmitted(
        uint256 indexed bundleId,
        address indexed submitter,
        uint256 txCount,
        uint256 timestamp
    );
    
    event BundleIncluded(
        uint256 indexed bundleId,
        uint256 blockNumber
    );
    
    event RelayerAuthorized(address indexed relayer, bool authorized);
    event RelayFeeUpdated(uint256 newFee);
    
    modifier onlyAuthorizedRelayer() {
        require(authorizedRelayers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor(uint256 _relayFee) Ownable(msg.sender) {
        relayFee = _relayFee;
        authorizedRelayers[msg.sender] = true;
    }
    
    /**
     * @notice Submit a transaction for private relay
     * @param target Contract address to call
     * @param value ETH value to send
     * @param data Transaction calldata
     * @param gasLimit Gas limit for the transaction
     * @param maxFeePerGas Maximum fee per gas
     * @param maxPriorityFeePerGas Maximum priority fee per gas
     */
    function submitRelayRequest(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 gasLimit,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas
    ) external payable nonReentrant returns (uint256) {
        require(target != address(0), "Invalid target");
        require(gasLimit > 0 && gasLimit <= 30_000_000, "Invalid gas limit");
        require(msg.value >= relayFee, "Insufficient relay fee");
        
        requestCounter++;
        
        relayRequests[requestCounter] = RelayRequest({
            txData: data,
            target: target,
            value: value,
            gasLimit: gasLimit,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            timestamp: block.timestamp,
            executed: false,
            submitter: msg.sender
        });
        
        userRequests[msg.sender].push(requestCounter);
        totalRelayed++;
        
        emit RelayRequestCreated(
            requestCounter,
            msg.sender,
            target,
            value,
            block.timestamp
        );
        
        return requestCounter;
    }
    
    /**
     * @notice Submit a bundle of transactions for atomic execution
     * @param targets Array of target addresses
     * @param values Array of ETH values
     * @param transactions Array of transaction calldata
     */
    function submitBundle(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata transactions
    ) external payable nonReentrant returns (uint256) {
        require(targets.length == transactions.length, "Length mismatch");
        require(targets.length == values.length, "Length mismatch");
        require(targets.length > 0, "Empty bundle");
        require(msg.value >= relayFee, "Insufficient relay fee");
        
        bundleCounter++;
        
        bundles[bundleCounter] = BundleSubmission({
            submitter: msg.sender,
            transactions: transactions,
            targets: targets,
            values: values,
            blockNumber: block.number,
            timestamp: block.timestamp,
            included: false
        });
        
        emit BundleSubmitted(
            bundleCounter,
            msg.sender,
            targets.length,
            block.timestamp
        );
        
        return bundleCounter;
    }
    
    /**
     * @notice Mark a bundle as included in a block
     * @param bundleId Bundle ID
     * @param blockNumber Block number where bundle was included
     */
    function markBundleIncluded(
        uint256 bundleId,
        uint256 blockNumber
    ) external onlyAuthorizedRelayer {
        require(bundleId > 0 && bundleId <= bundleCounter, "Invalid bundle ID");
        
        BundleSubmission storage bundle = bundles[bundleId];
        require(!bundle.included, "Already included");
        
        bundle.included = true;
        bundle.blockNumber = blockNumber;
        
        emit BundleIncluded(bundleId, blockNumber);
    }
    
    /**
     * @notice Execute a relayed transaction
     * @param requestId Request ID to execute
     */
    function executeRelay(uint256 requestId) external onlyAuthorizedRelayer nonReentrant {
        require(requestId > 0 && requestId <= requestCounter, "Invalid request ID");
        
        RelayRequest storage request = relayRequests[requestId];
        require(!request.executed, "Already executed");
        
        request.executed = true;
        
        // Execute the transaction
        (bool success, ) = request.target.call{value: request.value}(request.txData);
        require(success, "Transaction execution failed");
    }
    
    /**
     * @notice Authorize or deauthorize a relayer
     * @param relayer Address to authorize
     * @param authorized Authorization status
     */
    function setRelayerAuthorization(
        address relayer,
        bool authorized
    ) external onlyOwner {
        require(relayer != address(0), "Invalid address");
        authorizedRelayers[relayer] = authorized;
        
        emit RelayerAuthorized(relayer, authorized);
    }
    
    /**
     * @notice Update relay fee
     * @param newFee New relay fee
     */
    function setRelayFee(uint256 newFee) external onlyOwner {
        relayFee = newFee;
        
        emit RelayFeeUpdated(newFee);
    }
    
    /**
     * @notice Get user's relay requests
     * @param user User address
     */
    function getUserRequests(address user) external view returns (uint256[] memory) {
        return userRequests[user];
    }
    
    /**
     * @notice Get relay request details
     * @param requestId Request ID
     */
    function getRequestDetails(uint256 requestId) external view returns (
        address target,
        uint256 value,
        uint256 gasLimit,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas,
        uint256 timestamp,
        bool executed,
        address submitter
    ) {
        require(requestId > 0 && requestId <= requestCounter, "Invalid request ID");
        
        RelayRequest storage request = relayRequests[requestId];
        return (
            request.target,
            request.value,
            request.gasLimit,
            request.maxFeePerGas,
            request.maxPriorityFeePerGas,
            request.timestamp,
            request.executed,
            request.submitter
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
