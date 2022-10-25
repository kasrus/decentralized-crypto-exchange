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

    mapping(uint256 => _Order) public orders;
    uint256 public orderCount;
    mapping(uint256 => bool) public orderCanceled; 

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(uint256 id, address user, address tokenGet, uint256 amountGet,
        address tokenGive, uint256 amountGive, uint256 timestamp);
    event Cancel(uint256 id, address user, address tokenGet, uint256 amountGet,
        address tokenGive, uint256 amountGive, uint256 timestamp);

    //way to model the order
    struct _Order {
        uint256 id; //Unique identifier for order
        address user; //user who made an order
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp; //when the order was created
    }

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
    
    function withdrawToken(address _token, uint256 _amount) public {
        //Ensure user has enough tokens to withdraw
        require(tokens[_token][msg.sender] >= _amount);
        //Transfer tokens to user from exchange
        Token(_token).transfer(msg.sender, _amount);
        //Update user balace
        tokens[_token][msg.sender] -= _amount;
        //Emit event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }
    //Check balances in the exchange - wrapper function
    function balanceOf(address _token, address _user)
        public
        view
        returns(uint256) {
            return tokens[_token][_user];
    }

    // ------------------------------------------
    // MAKE & CANCEL ORDERS
    
    function makeOrder(address _tokenGet, 
        uint256 _amountGet, 
        address _tokenGive, 
        uint256 _amountGive) 
        public {
        //Token Give (the token they want to spend) - which token & how much?
        //Token Get (the token they want to receive) - which token & how much?

        //require token balance
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

        //instantiate new order
        orderCount += 1;

        orders[orderCount] = _Order(
            orderCount,
            msg.sender, //user
            _tokenGet, //tokenGet
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );

        //emit event
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, 
            _tokenGive, _amountGive, block.timestamp);
    }

    function cancelOrder(uint256 _id) public {
        //Fetch the order
        _Order storage _order = orders[_id];

        //Order must exist
        require(_order.id == _id);

        //Ensure the caller of the function is the owner of the order
        require(address(_order.user) == msg.sender);
        
        //Cancel the order
        orderCanceled[_id] = true;


        //Emit event
        emit Cancel(_order.id, msg.sender, _order.tokenGet , _order.amountGet, 
        _order.tokenGive, _order.amountGive, block.timestamp);
    }

}
