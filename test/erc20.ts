import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
//const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');
//const[owner,addr1,addr2]=accounts
const totalsupply='10000';
const decimal=18;

describe("erc20 toke test", function () {
  let erc20Token:Contract;
  let owner:SignerWithAddress,addr1:SignerWithAddress,addr2:SignerWithAddress;
  beforeEach("deploy geo contract",async function () {
    [owner,addr1,addr2] = await ethers.getSigners();
    const ERC20Token = await ethers.getContractFactory("Geo");
    
    erc20Token = await ERC20Token.deploy();
    await erc20Token.deployed();
    
  })
  
  it("totalsupply test", async function () {
    
    const totalbalance=await erc20Token.balanceOf(owner.address);
    console.log("totalbalance",totalbalance);
    expect(totalbalance).to.equal(ethers.utils.parseEther(totalsupply));
  })
  
  it("transform test",async function(){
    console.log("addr1 ",addr1.address);
     await erc20Token.transfer(addr1.address,1000);
     expect(await erc20Token.balanceOf(addr1.address)).to.equal(1000);
  })

  it("approve test",async function(){
    
     await erc20Token.approve(addr1.address,2000);
     expect(await erc20Token.allowance(owner.address,addr1.address)).to.equal(2000);
  })
  it("increaseAllowance test",async function(){
    await erc20Token.transfer(addr1.address,2000);
    
    await erc20Token.connect(addr1).approve(addr2.address,1000);
    expect(await erc20Token.allowance(addr1.address,addr2.address)).to.equal(1000);

 })
  it("decreaseAllowance test",async function(){
    await erc20Token.transfer(addr1.address,2000);
    await erc20Token.connect(addr1).approve(addr2.address,1000);
    
    await erc20Token.connect(addr1).decreaseAllowance(addr2.address,1000);
    expect(await erc20Token.allowance(addr1.address,addr2.address)).to.equal(0);
    await expect( erc20Token.connect(addr1).decreaseAllowance(addr2.address,2000)).to.be.revertedWith('ERC20: decreased allowance below zero');
  })
  it("mint test", async function () {
    // console.log("owner balance",await erc20Token.balanceOf(owner.address));
     //expect(await erc20Token.balanceOf(owner.address)).to.equal(totalsupply*10**decimal);
  })
});

describe("测试erc20合约标准方法",function(){
  
})