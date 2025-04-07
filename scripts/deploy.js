const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const MyContract = await ethers.getContractFactory("MyNFT");

    // Pass deployer.address as the initialOwner argument to initialize()
    const mc = await upgrades.deployProxy(MyContract, [deployer.address], {
        initializer: "initialize"
    });

    await mc.waitForDeployment();

    console.log("MyNFT deployed to:", await mc.getAddress());
    console.log(`Deployed by ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
