const {ethers} = require("hardhat");
const {expect} = require("chai");

const tokens = (n)=> {
   return ethers.utils.parseEther(n.toString());
}

describe('Token', ()=> {
   let token, accounts, deployer, receiver, exchange;
   
   beforeEach(async()=> {
      //fetch token from the blockchain
      const Token = await ethers.getContractFactory('Token');
      token = await Token.deploy('DApp University', 'DAPP', 1000000); 

      accounts = await ethers.getSigners();
      deployer = accounts[0]; //same as msg.sender
      receiver = accounts[1];
      exchange = accounts[2];
   })

   describe('Deployment', ()=> {
      const name = 'DApp University';
      const symbol = 'DAPP';
      const decimals = 18;
      const totalSupply = tokens(1000000);

      it('has correct name', async()=> {
         expect(await token.name()).to.equal(name);
      })
      
      it('has correct symbol', async()=> {
         expect(await token.symbol()).to.equal(symbol);
      })
   
      it('has correct decimals', async()=> {
         expect(await token.decimals()).to.equal(decimals);
      })
   
      it('has correct total supply', async()=> {
         expect(await token.totalSupply()).to.equal(totalSupply);
      })   

      it('assigns total supply to the deployer', async()=> {
         expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
      })
   })

   describe('Sending Tokens', ()=> {
      let amount, transaction, result; 
      
      describe ('Success', ()=> {
         beforeEach(async()=> {
            amount = tokens(100);
            //Transfer tokens-> need to call transfer function from token
            transaction = await token.connect(deployer).transfer(receiver.address, amount);
            result = await transaction.wait(); //wait for the entire transaction to finish
         })

         it('transfers token balances', async()=> {
            //wait for the transaction to be included in the block
            //Ensure that tokens were transfered (balance changed)
            expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900));
            expect(await token.balanceOf(receiver.address)).to.equal(amount);
         })
   
         it('emits a Transfer event', async()=> {
            const event = result.events[0];
            expect(event.event).to.equal('Transfer');
            const args = event.args;
            //Then check the individual arguments
            expect(args._from).to.equal(deployer.address);
            expect(args._to).to.equal(receiver.address);
            expect(args._value).to.equal(amount);
           
         })
      })
      
      describe ('Failure', ()=> {
         it('rejects insufficient balances', async()=> {
            //Transfer tokens more than what the deployer has - 10M tokens
            const invalidAmount = tokens(100000000);
            await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted;
         })

         it('rejects invalid recipient', async () => {
            amount = tokens(100);
            await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted;
         })
      })
   })

   describe('Approving Tokens', () => {
      let amount, transaction, result;
      beforeEach(async() => {
         amount = tokens(100);
         transaction = await token.connect(deployer).approve(exchange.address, amount);
         result = await transaction.wait();
      })

      describe('Success', ()=> {
         it('allocates an allowance for delegated token spending', async () => {
            expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount);
         })
         it('emits Approval event', async()=> {
            const event = result.events[0];
            expect(event.event).to.equal('Approval');
            const args = event.args;

            expect(args._owner).to.equal(deployer.address);
            expect(args._spender).to.equal(exchange.address);
            expect(args._value).to.equal(amount);
         })
      }) 
      describe('Failure', ()=> {
         it('rejects invalid spenders', async()=> {
            await expect(token.connect(deployer).approve("0x0000000000000000000000000000000000000000", amount)).to.be.reverted;
         })
      })  
   })

   describe('Delegated Token Transfers', ()=> {
      let amount, transaction, result;
      //always need to approve first 
      beforeEach(async() => {
         amount = tokens(100);
         transaction = await token.connect(deployer).approve(exchange.address, amount);
         result = await transaction.wait();
      })

      describe('Success', ()=> {
         beforeEach(async() => {
            transaction = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount);
            result = await transaction.wait();
         })

         it('transfers token balances', async()=> {
            expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900));
            expect(await token.balanceOf(receiver.address)).to.equal(amount);
         })

        it('resets the allowance', async()=> {
            expect(await token.allowance(deployer.address, exchange.address))
            .to.equal(tokens(0));
        })
        
        it('emits a Transfer event', async()=> {
            const event = result.events[0]; 
            expect(event.event).to.equal('Transfer');
            const args = event.args;
            //Then check the individual arguments
            expect(args._from).to.equal(deployer.address);
            expect(args._to).to.equal(receiver.address);
            expect(args._value).to.equal(amount);
         })
      }) 
      
      describe('Failure', ()=> {
         //Attempts to transfer too many tokens
         it('rejects insufficient amounts', async() => {
            const invalidAmount = tokens(1000000000);
            await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount))
               .to.be.reverted;
         
         })    
      })
   })
})
