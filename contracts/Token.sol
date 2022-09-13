//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// Import this file to use console.log
import "hardhat/console.sol";

contract Token {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    //Track balances
    mapping(address => uint256) public balanceOf;
    
    //Event
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply;
    }   

    function transfer(address _to, uint256 _value) public returns (bool success) {
        //require that sender has enough tokens to spend
        require(balanceOf[msg.sender] >= _value);
        require(_to != address(0));

        //deduct tokens from spender
        balanceOf[msg.sender] -= _value;
        //credit tokens to receiver
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);

        return true;
    }
}
 