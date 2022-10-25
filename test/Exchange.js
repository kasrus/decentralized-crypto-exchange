const {ethers} = require("hardhat");
const {expect} = require("chai");

const tokens = (n) => {
    return ethers.utils.parseEther(n.toString());
}

describe('Exchange', ()=> {
    let deployer, feeAccount, accounts, exchange, token1, 
        user1, user2, token2, transaction;
    const feePercent = 10;

    beforeEach(async()=> {
        const Exchange = await ethers.getContractFactory('Exchange');
        const Token = await ethers.getContractFactory('Token');

        token1 = await Token.deploy('DApp University', 'DAPP', 1000000); 
        token2 = await Token.deploy('Mock Dai', 'mDAI', 1000000);
        accounts = await ethers.getSigners();
        deployer = accounts[0]; //same as msg.sender
        feeAccount = accounts[1];
        user1 = accounts[2];
        user2 = accounts[3];
        
        transaction = await token1.connect(deployer).transfer(user1.address, tokens(100));
        await transaction.wait();

        transaction = await token2.connect(deployer).transfer(user2.address, tokens(100));
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
        let transaction;            
        let amount = tokens(1);

        beforeEach(async()=> {
            //Deposit token - need to approve token first because depositToken calls transfer
            transaction = await token1.connect(user1).approve(exchange.address, amount);
            await transaction.wait();
            //transferFrom from Token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount);
            await transaction.wait();
        })

        it('returns user balance', async()=> {
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount);
        })    
    })

    describe('Making orders', () => {
        let transaction, result;
        let amount = tokens(1);

        describe('Success', async() => {
            beforeEach(async() => {
                //Need to deposit tokens before withdrawing
                //Deposit token - need to approve token first because depositToken calls transfer
                transaction = await token1.connect(user1).approve(exchange.address, amount);
                result = await transaction.wait();
                //transferFrom from Token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount);
                result = await transaction.wait();
                
                //make order
                transaction = await exchange.connect(user1).makeOrder(token2.address, amount, 
                        token1.address, amount);
                result = await transaction.wait();
            })

            it('tracks the newly created order', async() => {
                expect (await exchange.orderCount()).to.equal(1);
            })
            
            it('emits an Order event', async() => {
                const event = result.events[0];
                expect(event.event).to.equal('Order');
                const args = event.args;
                expect(args.id).to.equal(1);
                expect(args.user).to.equal(user1.address);
                expect(args.tokenGet).to.equal(token2.address);
                expect(args.amountGet).to.equal(tokens(1));
                expect(args.tokenGive).to.equal(token1.address);
                expect(args.amountGive).to.equal(tokens(1));
                expect(args.timestamp).to.at.least(1);
            })
        }) //end of success

        describe('Failure', async() => {
            it('rejects with no balance', async() => {
                await expect(exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1)))
                .to.be.reverted;

            })
        }) //end of failure
    }) //end of making orders

    describe('Order actions', async() => {
        let transaction, result;
        let amount = tokens(1);
        beforeEach(async() => {
             //Need to deposit tokens before withdrawing
            //Deposit token - need to approve token first because depositToken calls transfer
            transaction = await token1.connect(user1).approve(exchange.address, amount);
            result = await transaction.wait();
            //transferFrom from Token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount);
            result = await transaction.wait();
            
            //make order
            transaction = await exchange.connect(user1).makeOrder(token2.address, amount, 
                    token1.address, amount);
            result = await transaction.wait();
        })

        describe('Canceling orders', async() => {
            describe('Success', async() => {
                beforeEach(async() => {
                    transaction = await exchange.connect(user1).cancelOrder(1);
                    result = await transaction.wait();
                })
                
                it('updates canceled orders', async() => {
                    expect(await exchange.orderCanceled(1)).to.equal(true);
                })
                it('emits a Cancel event', async() => {
                    const event = result.events[0];
                    expect(event.event).to.equal('Cancel');

                    const args = event.args;
                    expect(args.user).to.equal(user1.address);
                    expect(args.tokenGet).to.equal(token2.address);
                    expect(args.amountGet).to.equal(amount);
                    expect(args.tokenGive).to.equal(token1.address);
                    expect(args.amountGive).to.equal(amount);
                    expect(args.timestamp).to.at.least(1);
                })
            })
            describe('Failure', async() => {
                it('rejects invalid order ids', async() => {
                    const invalidOrderID = 9999;
                    await expect(exchange.connect(user1).cancelOrder(invalidOrderID)).to.be.reverted;
                })
                it('rejects unauthorized cancelations', async() => {
                    await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted;
                })
            })
        })
    })
}) //end of exchange
