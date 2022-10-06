//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// Import this file to use console.log
import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint8 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;
    //the first address is token's address
    //the second address is user's address
    //uint256 - how many tokens deposited to the exchange

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);

    constructor(address _feeAccount, uint8 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // ---------------------------------------
    // DEPOSIT & WITHDRAW TOKENS

    //Deposit tokens
    //we want this function to be able to work with any kind of ERC-20 token
    function depositToken(address _token, uint256 _amount) public {
        //Transfer tokens to exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        //Update user balance
        tokens[_token][msg.sender] += _amount;

        //Emit an event that deposit happened
        emit Deposit(_token, msg.sender, _amount, balanceOf(_token, msg.sender));
    } 

    //Check balances in the exchange - wrapper function
    function balanceOf(address _token, address _user)
        public
        view
        returns(uint256) {
            return tokens[_token][_user];
    }
}
