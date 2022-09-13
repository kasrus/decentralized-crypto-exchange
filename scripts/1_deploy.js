const {ethers} = require("hardhat");

async function main() {
    //get the contract to deploy
    const Token = await ethers.getContractFactory("Token");
    //deploy contract
    const token = await Token.deploy();
    //fetch copy of the contract that was deployed
    await token.deployed();
    console.log(`Token deployed to: ${token.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});