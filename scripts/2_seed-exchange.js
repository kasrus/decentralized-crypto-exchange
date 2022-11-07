const { ethers } = require("hardhat");
const config = require("../src/config.json")

const tokens = (n) => {
    return ethers.utils.parseEther(n.toString());
}

//waiting function for arbitrary second
const wait = (seconds) => {
    const milliseconds = seconds * 1000;
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function main() {
    const accounts = await ethers.getSigners();

    //Fetch network
    const { chainId } = await ethers.provider.getNetwork();
    console.log('Using chainID: ', chainId);

    const DApp = await ethers.getContractAt('Token', config[chainId].DApp.address);
    console.log(`Dapp token fetched: ${DApp.address}\n`);

    const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address);
    console.log(`mETH token fetched: ${mETH.address}\n`);

    const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address);
    console.log(`mDAI token fetched: ${mDAI.address}\n`);
    
    const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address);
    console.log(`Exchange fetched: ${exchange.address}\n`);

    //Give tokens to account[1]
    const sender = accounts[0];
    const receiver = accounts[1];
    let amount = tokens(10000);

    //sender aka msg.sender, sending user2 10k mETH
    let transaction, result;
    transaction = await mETH.connect(sender).transfer(receiver.address, amount);
    result =  await transaction.wait();
    console.log(`Transferred ${amount} tokens from ${sender.address} to ${receiver.address}\n`);

    //Set up exchange users
    const user1 = accounts[0];
    const user2 = accounts[1]; 
    amount = tokens(10000);

    //user1 approves 10k Dapp to the exchange
    transaction = await DApp.connect(user1).approve(exchange.address, amount);
    result = await transaction.wait();
    console.log(`Approved ${amount} Ether from ${user1.address}\n`);

    //user1 deposits 10k Dapp to the exchange
    transaction = await exchange.connect(user1).depositToken(DApp.address, amount);
    result = await transaction.wait();
    console.log(`Deposited ${amount} Ether from ${user1.address}\n`);

    //user2 approves exchange account mETH
    transaction = await mETH.connect(user2).approve(exchange.address, amount);
    result = await transaction.wait();
    console.log(`Approved ${amount} tokens from ${user2.address}\n`);
    
    //user2 deposit mETH
    transaction = await exchange.connect(user2).depositToken(mETH.address, amount);
    result = await transaction.wait();
    console.log(`Deposited ${amount} Ether from ${user2.address}\n`); 

    // ---------------------------------------------------
    // Seed a cancelled order
    //
    // User1 makes order to get tokens
    let orderID;
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), DApp.address, tokens(5));
    result = await transaction.wait();
    console.log(`Make order from ${user1.address}`);

    //User1 cancels order
    orderID = result.events[0].args.id; //get the order ID from the event
    transaction = await exchange.connect(user1).cancelOrder(orderID);
    result = await transaction.wait();
    console.log(`Cancelled order from ${user1.address}\n`);

    //wait 1 second
    await wait(1);

    // --------------------------------------------------
    // Seed Filled Orders
    //

    //User1 makes order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), DApp.address, tokens(10));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    //User2 fills order
    orderID = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrder(orderID);
    result = await transaction.wait();
    console.log(`Filled order from ${user1.address}`);

    //User1 makes another order
    transaction = await exchange.makeOrder(mETH.address, tokens(50), DApp.address, tokens(15));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    //User2 fills order
    orderID = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrder(orderID);
    result = await transaction.wait();
    console.log(`Filled order from ${user1.address}`);

    //Wait 1 second
    await wait(1);

    //User1 makes final order
    transaction = await exchange.makeOrder(mETH.address, tokens(200), DApp.address, tokens(20));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    //User2 fills order
    orderID = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrder(orderID);
    result = await transaction.wait();
    console.log(`Filled order from ${user1.address}`);

    //Wait 1 second
    await wait(1);

    //--------------------------------------
    //Seed Open Orders
    //

    //User1 makes 10 orders
    for(let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(i * 10), DApp.address, tokens(10));
        result = await transaction.wait();

        console.log(`Made order from ${user1.address}`);

        //wait 1 second
        await wait(1);
    }
    
    //User2 makes 10 orders
    for(let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user2).makeOrder(DApp.address, tokens(10), mETH.address, tokens(10 * i));
        result = await transaction.wait();

        console.log(`Made order from ${user2.address}`);

        //wait 1 second
        await wait(1);
    }

}
  
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });