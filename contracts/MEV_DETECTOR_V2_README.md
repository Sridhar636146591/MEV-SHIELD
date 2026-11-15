# MEV Detector V2 - Solidity Smart Contract

## Overview

MEVDetectorV2 is an advanced Solidity smart contract for detecting and preventing MEV (Maximal Extractable Value) attacks on Ethereum. This contract provides comprehensive protection against sandwich attacks, front-running, back-running, and liquidity sniping.

## Features

### 🔍 Detection Capabilities

1. **Sandwich Attack Detection**
   - Analyzes mempool patterns
   - Detects suspicious trading activity
   - Calculates severity levels (LOW, MEDIUM, HIGH, CRITICAL)
   - Real-time event emission

2. **Front-Running Detection**
   - Monitors gas price manipulation
   - Compares against average gas prices
   - Tracks transaction ordering anomalies

3. **Back-Running Detection**
   - Identifies profit extraction patterns
   - Monitors block-level activities
   - Tracks arbitrage exploitation

4. **Liquidity Sniping Detection**
   - Detects instant liquidity grabs
   - Monitors new token launches
   - Tracks sniper bot activity

### 🛡️ Protection Services

1. **Subscription-Based Protection**
   - Basic (0.1 ETH/month)
   - Premium (0.25 ETH/month)
   - Enterprise (0.5 ETH/month)

2. **Reward System**
   - Bug bounty rewards for valid reports
   - Community-driven verification
   - Automated reward distribution

3. **Trader Profiles**
   - Track MEV extraction history
   - Maintain attacker reputation scores
   - Blacklist malicious addresses

## Contract Architecture

### State Variables

```solidity
// Detection severity levels
SEVERITY_LOW = 1
SEVERITY_MEDIUM = 2
SEVERITY_HIGH = 3
SEVERITY_CRITICAL = 4

// Contract state
reportCounter: uint256
detectionFee: uint256
rewardPool: uint256

// Mappings
traderProfiles: mapping(address => TraderProfile)
reports: mapping(uint256 => MEVReport)
subscriptions: mapping(address => ProtectionSubscription)
```

### Key Structures

```solidity
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
```

## Functions

### Detection Functions

#### `detectSandwichAttack`
```solidity
function detectSandwichAttack(
    address token,
    uint256 amount,
    uint256 slippage
) external payable returns (uint256 severity)
```
- Detects potential sandwich attacks
- Requires detection fee payment
- Returns severity level (1-4)

#### `detectFrontRunning`
```solidity
function detectFrontRunning(
    bytes32 victimTxHash,
    uint256 gasPriceUsed
) external returns (bool)
```
- Identifies front-running attempts
- Compares gas prices to network average
- Returns true if detected

#### `detectBackRunning`
```solidity
function detectBackRunning(
    address victim,
    uint256 profit
) external returns (bool)
```
- Detects back-running activity
- Minimum threshold: 1 ETH profit
- Returns true if detected

### Protection Functions

#### `subscribeToProtection`
```solidity
function subscribeToProtection(
    uint256 duration,
    uint256 level
) external payable
```
- Subscribe to protection service
- Duration in seconds
- Level: 1 (Basic), 2 (Premium), 3 (Enterprise)

#### `submitMEVReport`
```solidity
function submitMEVReport(
    string calldata attackType,
    address target,
    bytes calldata evidence
) external activeProtection returns (uint256)
```
- Submit MEV attack report
- Requires active protection subscription
- Returns report ID

### Administrative Functions

#### `verifyReport`
```solidity
function verifyReport(
    uint256 reportId,
    bool isValid
) external onlyOwner
```
- Verify submitted reports
- Distributes rewards for valid reports
- Updates attacker blacklists

#### `getTraderProfile`
```solidity
function getTraderProfile(
    address trader
) external view returns (
    uint256 totalMEV,
    uint256 successful,
    uint256 failed,
    bool blacklisted
)
```
- View trader's MEV activity
- Returns comprehensive profile data

## Deployment

### Prerequisites

1. Install Hardhat:
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

2. Configure network in `hardhat.config.js`:
```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    mainnet: {
      url: process.env.ALCHEMY_MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### Deploy to Testnet (Sepolia)

```bash
# Set environment variables
export ALCHEMY_SEPOLIA_URL="your_alchemy_url"
export PRIVATE_KEY="your_private_key"

# Deploy contract
npx hardhat run scripts/deployV2.js --network sepolia
```

### Deploy to Mainnet

```bash
# WARNING: Mainnet deployment requires significant ETH for gas
npx hardhat run scripts/deployV2.js --network mainnet
```

### Deployment Output

The deployment script will output:
- Contract address
- Network name
- Owner address
- Detection fee
- Reward pool balance
- Deployment info JSON file

## Usage Examples

### 1. Subscribe to Protection

```javascript
const contract = await ethers.getContractAt("MEVDetectorV2", contractAddress);

// Subscribe to Premium protection for 30 days
await contract.subscribeToProtection(
    2592000, // 30 days in seconds
    2,       // Premium level
    { value: ethers.parseEther("0.25") }
);
```

### 2. Detect Sandwich Attack

```javascript
// Report a potential sandwich attack
const severity = await contract.detectSandwichAttack(
    tokenAddress,
    ethers.parseEther("10"), // 10 tokens
    500,                     // 5% slippage
    { value: ethers.parseEther("0.01") } // Detection fee
);
```

### 3. Submit MEV Report

```javascript
// Submit a sandwich attack report
const tx = await contract.submitMEVReport(
    "sandwich",
    attackerAddress,
    evidenceData,
    { gasLimit: 500000 }
);

const receipt = await tx.wait();
console.log("Report submitted with ID:", reportId);
```

### 4. Get Trader Profile

```javascript
const profile = await contract.getTraderProfile(suspectAddress);
console.log({
    totalMEVExtracted: profile.totalMEV.toString(),
    successfulAttacks: profile.successfulAttacks.toString(),
    failedAttacks: profile.failedAttacks.toString(),
    isBlacklisted: profile.blacklisted
});
```

## Events

### SandwichAttackDetected
```solidity
event SandwichAttackDetected(
    address indexed attacker,
    address indexed victim,
    address indexed token,
    uint256 amount,
    uint256 timestamp,
    uint256 severity
);
```

### FrontRunningDetected
```solidity
event FrontRunningDetected(
    address indexed attacker,
    address indexed victim,
    bytes32 txHash,
    uint256 gasPrice,
    uint256 timestamp
);
```

### ReportSubmitted
```solidity
event ReportSubmitted(
    address indexed reporter,
    uint256 reportId,
    string reportType,
    uint256 reward
);
```

## Security Considerations

### Access Control
- Only owner can verify reports
- Protected functions require active subscription
- Treasury management restricted to owner

### Economic Security
- Detection fees prevent spam
- Reward pool funded separately
- Rewards distributed only after verification

### Gas Optimization
- Efficient storage patterns
- Minimal on-chain computation
- Event-based off-chain data tracking

## Integration with Frontend

### React/Next.js Integration

```javascript
import { ethers } from 'ethers';
import MEVDetectorABI from './abis/MEVDetectorV2.json';

const contractAddress = '0x...';

async function connectWallet() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, MEVDetectorABI.abi, signer);
}

async function subscribeToProtection(level, duration) {
    const contract = await connectWallet();
    const price = await contract.getSubscriptionPrice(level);
    
    const tx = await contract.subscribeToProtection(duration, level, {
        value: price
    });
    
    await tx.wait();
    console.log('Protection activated!');
}
```

## Testing

### Run Tests

```bash
npx hardhat test
```

### Test Coverage

```bash
npx hardhat coverage
```

## Audit Status

This contract is provided as-is. Before deploying to mainnet:
- ✅ Perform comprehensive security audit
- ✅ Conduct thorough testing on testnet
- ✅ Implement bug bounty program
- ✅ Review gas optimization opportunities

## License

MIT License - See LICENSE file for details

## Support

For questions or issues:
- GitHub Issues
- Discord Community
- Documentation: [docs.mevdetector.io](https://docs.mevdetector.io)

---

**Disclaimer**: This contract is for educational and research purposes. Always conduct your own security research before deploying smart contracts to mainnet.
