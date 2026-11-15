const hre = require("hardhat");

async function main() {
  console.log("Deploying MEVDetectorV2 contract...");

  // Get the deployer's address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deployment parameters
  const detectionFee = hre.ethers.parseEther("0.01"); // 0.01 ETH detection fee

  // Deploy the contract
  const MEVDetectorV2 = await hre.ethers.getContractFactory("MEVDetectorV2");
  const mevDetector = await MEVDetectorV2.deploy(detectionFee);

  await mevDetector.waitForDeployment();

  const contractAddress = await mevDetector.getAddress();
  console.log("MEVDetectorV2 deployed to:", contractAddress);

  // Verify deployment
  const owner = await mevDetector.owner();
  console.log("Contract owner:", owner);

  const currentDetectionFee = await mevDetector.detectionFee();
  console.log("Detection fee:", hre.ethers.formatEther(currentDetectionFee), "ETH");

  // Fund the reward pool with some ETH
  console.log("\nFunding reward pool with 0.5 ETH...");
  const fundTx = await deployer.sendTransaction({
    to: contractAddress,
    value: hre.ethers.parseEther("0.5")
  });
  await fundTx.wait();
  console.log("Reward pool funded!");

  // Get reward pool balance
  const rewardPoolBalance = await hre.ethers.provider.getBalance(contractAddress);
  console.log("Contract balance (reward pool):", hre.ethers.formatEther(rewardPoolBalance), "ETH");

  console.log("\n===========================================");
  console.log("Deployment Summary");
  console.log("===========================================");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("Owner:", owner);
  console.log("Detection Fee:", hre.ethers.formatEther(currentDetectionFee), "ETH");
  console.log("Reward Pool:", hre.ethers.formatEther(rewardPoolBalance), "ETH");
  console.log("===========================================");

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    owner: owner,
    detectionFee: hre.ethers.formatEther(currentDetectionFee),
    rewardPool: hre.ethers.formatEther(rewardPoolBalance),
    deployedAt: new Date().toISOString()
  };

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }

  // Save to file
  const filename = `./deployments/MEVDetectorV2_${hre.network.name}_${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${filename}`);

  // Wait for block confirmations
  console.log("\nWaiting for block confirmations...");
  await mevDetector.deploymentTransaction()?.wait(6);
  console.log("Deployment confirmed!");
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
