// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MEVTreasury
 * @notice Treasury contract for managing protocol funds and distributions
 * @dev Implements secure fund management with multi-sig capabilities
 */
contract MEVTreasury is Ownable, ReentrancyGuard {
    
    struct Transaction {
        address recipient;
        uint256 amount;
        address token;
        string purpose;
        uint256 timestamp;
        bool executed;
        uint256 approvals;
    }
    
    struct Budget {
        uint256 total;
        uint256 spent;
        uint256 remaining;
        uint256 periodStart;
        uint256 periodDuration;
        bool isActive;
    }
    
    // State variables
    uint256 public transactionCounter;
    uint256 public requiredApprovals = 2;
    uint256 public totalTreasuryValue;
    
    mapping(uint256 => Transaction) public transactions;
    mapping(address => Budget) public budgets;
    mapping(address => mapping(uint256 => bool)) public hasApproved;
    mapping(address => bool) public treasuryMembers;
    mapping(address => uint256) public tokenBalances;
    
    address[] public supportedTokens;
    mapping(address => bool) public isTokenSupported;
    
    // Events
    event TransactionProposed(
        uint256 indexed txId,
        address indexed recipient,
        uint256 amount,
        address token,
        string purpose
    );
    
    event TransactionApproved(
        uint256 indexed txId,
        address indexed approver
    );
    
    event TransactionExecuted(
        uint256 indexed txId,
        address indexed recipient,
        uint256 amount
    );
    
    event DepositReceived(
        address indexed token,
        uint256 amount,
        address indexed sender
    );
    
    event BudgetCreated(
        address indexed recipient,
        uint256 total,
        uint256 duration
    );
    
    event TreasuryMemberAdded(address indexed member);
    event TreasuryMemberRemoved(address indexed member);
    
    modifier onlyTreasuryMember() {
        require(treasuryMembers[msg.sender], "Not a treasury member");
        _;
    }
    
    modifier validTransaction(uint256 txId) {
        require(txId > 0 && txId <= transactionCounter, "Invalid transaction");
        require(!transactions[txId].executed, "Already executed");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        treasuryMembers[msg.sender] = true;
    }
    
    /**
     * @notice Propose a treasury transaction
     * @param recipient Recipient address
     * @param amount Amount to send
     * @param token Token address (address(0) for ETH)
     * @param purpose Purpose of transaction
     */
    function proposeTransaction(
        address recipient,
        uint256 amount,
        address token,
        string calldata purpose
    ) external onlyTreasuryMember returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        
        if (token != address(0)) {
            require(isTokenSupported[token], "Token not supported");
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient token balance");
        } else {
            require(address(this).balance >= amount, "Insufficient ETH balance");
        }
        
        transactionCounter++;
        
        transactions[transactionCounter] = Transaction({
            recipient: recipient,
            amount: amount,
            token: token,
            purpose: purpose,
            timestamp: block.timestamp,
            executed: false,
            approvals: 1
        });
        
        hasApproved[msg.sender][transactionCounter] = true;
        
        emit TransactionProposed(transactionCounter, recipient, amount, token, purpose);
        
        return transactionCounter;
    }
    
    /**
     * @notice Approve a proposed transaction
     * @param txId Transaction ID
     */
    function approveTransaction(uint256 txId) external onlyTreasuryMember validTransaction(txId) {
        require(!hasApproved[msg.sender][txId], "Already approved");
        
        hasApproved[msg.sender][txId] = true;
        transactions[txId].approvals++;
        
        emit TransactionApproved(txId, msg.sender);
        
        // Auto-execute if enough approvals
        if (transactions[txId].approvals >= requiredApprovals) {
            _executeTransaction(txId);
        }
    }
    
    /**
     * @notice Add supported token
     * @param token Token address
     */
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(!isTokenSupported[token], "Already supported");
        
        isTokenSupported[token] = true;
        supportedTokens.push(token);
    }
    
    /**
     * @notice Create budget for a recipient
     * @param recipient Recipient address
     * @param total Total budget amount
     * @param duration Budget period duration
     */
    function createBudget(
        address recipient,
        uint256 total,
        uint256 duration
    ) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(total > 0, "Invalid amount");
        require(duration > 0, "Invalid duration");
        
        budgets[recipient] = Budget({
            total: total,
            spent: 0,
            remaining: total,
            periodStart: block.timestamp,
            periodDuration: duration,
            isActive: true
        });
        
        emit BudgetCreated(recipient, total, duration);
    }
    
    /**
     * @notice Add treasury member
     * @param member Member address
     */
    function addTreasuryMember(address member) external onlyOwner {
        require(member != address(0), "Invalid address");
        require(!treasuryMembers[member], "Already a member");
        
        treasuryMembers[member] = true;
        
        emit TreasuryMemberAdded(member);
    }
    
    /**
     * @notice Remove treasury member
     * @param member Member address
     */
    function removeTreasuryMember(address member) external onlyOwner {
        require(treasuryMembers[member], "Not a member");
        require(treasuryMembers.length > 1, "Cannot remove last member");
        
        treasuryMembers[member] = false;
        
        emit TreasuryMemberRemoved(member);
    }
    
    /**
     * @notice Update required approvals
     * @param newRequired New required approvals count
     */
    function setRequiredApprovals(uint256 newRequired) external onlyOwner {
        require(newRequired > 0 && newRequired <= treasuryMembers.length, "Invalid count");
        requiredApprovals = newRequired;
    }
    
    /**
     * @notice Get transaction details
     * @param txId Transaction ID
     */
    function getTransaction(uint256 txId) external view returns (
        address recipient,
        uint256 amount,
        address token,
        string memory purpose,
        uint256 timestamp,
        bool executed,
        uint256 approvals
    ) {
        require(txId > 0 && txId <= transactionCounter, "Invalid transaction");
        
        Transaction storage tx = transactions[txId];
        return (
            tx.recipient,
            tx.amount,
            tx.token,
            tx.purpose,
            tx.timestamp,
            tx.executed,
            tx.approvals
        );
    }
    
    /**
     * @notice Get budget details
     * @param recipient Recipient address
     */
    function getBudget(address recipient) external view returns (
        uint256 total,
        uint256 spent,
        uint256 remaining,
        uint256 periodStart,
        uint256 periodDuration,
        bool isActive
    ) {
        Budget storage budget = budgets[recipient];
        return (
            budget.total,
            budget.spent,
            budget.remaining,
            budget.periodStart,
            budget.periodDuration,
            budget.isActive
        );
    }
    
    /**
     * @notice Get supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
    
    /**
     * @notice Emergency withdraw (only owner, for critical situations)
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(token != address(0), "Invalid token");
        
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient balance");
            payable(owner()).transfer(amount);
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient balance");
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    // Internal functions
    
    function _executeTransaction(uint256 txId) internal {
        Transaction storage tx = transactions[txId];
        require(!tx.executed, "Already executed");
        
        tx.executed = true;
        
        if (tx.token == address(0)) {
            payable(tx.recipient).transfer(tx.amount);
        } else {
            bool success = IERC20(tx.token).transfer(tx.recipient, tx.amount);
            require(success, "Token transfer failed");
        }
        
        emit TransactionExecuted(txId, tx.recipient, tx.amount);
    }
    
    /**
     * @notice Receive ETH
     */
    receive() external payable {
        emit DepositReceived(address(0), msg.value, msg.sender);
    }
}
