const {ethers} = require("hardhat");
const {expect} = require("chai");

const tokens = (n) => {
    return ethers.utils.parseEther(n.toString());
}

describe('Exchange', ()=> {
    let deployer, feeAccount, accounts, exchange, token1, 
        user1, user2;
    const feePercent = 10;

    beforeEach(async()=> {
        const Exchange = await ethers.getContractFactory('Exchange');
        const Token = await ethers.getContractFactory('Token');

        token1 = await Token.deploy('DApp University', 'DAPP', 1000000); 

        accounts = await ethers.getSigners();
        deployer = accounts[0]; //same as msg.sender
        feeAccount = accounts[1];
        user1 = accounts[2];
        user2 = accounts[3];
        
        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100));
        await transaction.wait();

        exchange = await Exchange.deploy(feeAccount.address, feePercent);
    })
 
    describe('Deployment', ()=> {
        it('tracks the fee account', async() => {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address);
        })

        it('tracks the fee percent', async() => {
            expect(await exchange.feePercent()).to.equal(feePercent);
        })
    })

    describe('Depositing Tokens', ()=> {
        let transaction, result;            
        let amount = tokens(10);

        describe('Success', ()=> {
            beforeEach(async()=> {
                //Deposit token - need to approve token first because depositToken calls transfer
                transaction = await token1.connect(user1).approve(exchange.address, amount);
                result = await transaction.wait();
                //transferFrom from Token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount);
                result = await transaction.wait();
            })

            it('tracks the token deposit', async()=> {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount);
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount);
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount);
            })
            it('emits a Deposit event', async() => {
                const event = result.events[1];
                expect(event.event).to.equal('Deposit');
                const args = event.args;
                expect(args.token).to.equal(token1.address);
                expect(args.user).to.equal(user1.address);
                expect(args.amount).to.equal(amount);
                expect(args.balance).to.equal(amount);
            })
        })
        describe('Failure', ()=> {
            it('fails when no tokens are approved', async() => {
                //Don't approve any tokens before depositing
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted;
            })
        })
    })

    describe('Withdrawing Tokens', () => {
        let transaction, result;
        let amount = tokens(10);
        
        describe('Success', () => {
            beforeEach(async() => {
                //Need to deposit tokens before withdrawing
                //Deposit token - need to approve token first because depositToken calls transfer
                transaction = await token1.connect(user1).approve(exchange.address, amount);
                result = await transaction.wait();
                //transferFrom from Token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount);
                result = await transaction.wait();
                //Withdraw
                transaction = await exchange.connect(user1).withdrawToken(token1.address, amount);
                result = await transaction.wait();
            })
            it('withdraws tokens funds', async() => {
                expect(await token1.balanceOf(exchange.address)).to.equal(0);
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0);
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(0);
            })
            it('emits a Withdraw event', async() => {
               const event = result.events[1];
               expect(event.event).to.equal('Withdraw');
               const args = event.args;
               expect(args.token).to.equal(token1.address);
               expect(args.user).to.equal(user1.address);
               expect(args.amount).to.equal(amount);
               expect(args.balance).to.equal(0);
            })
        })
        describe('Failure', ()=> {
            it('fails for insufficient balances', async() => {
                //Attempt to withdraw tokens without depositing
                await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted;
            })
        })
    })

    describe('Checking Balances', ()=> {
        let transaction, result;            
        let amount = tokens(1);

        beforeEach(async()=> {
            //Deposit token - need to approve token first because depositToken calls transfer
            transaction = await token1.connect(user1).approve(exchange.address, amount);
            result = await transaction.wait();
            //transferFrom from Token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount);
            result = await transaction.wait();
        })

        it('tracks the token deposit', async()=> {
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount);
        })    
    })
})
