import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
//const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');
//const[owner,addr1,addr2]=accounts
const nftId1=111;
const nftId2=6666;
const startPrice=100;
const reservedPrice=50;
const discountRate=1;

describe("Dutch aution test", function () {
  let nft:Contract;
  let dutchAution:Contract;
  let owner:SignerWithAddress,addr1:SignerWithAddress,addr2:SignerWithAddress;
  beforeEach("deploy nft contract",async function () {
    [owner,addr1,addr2] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("CollectionTTT");
    
    nft = await NFT.deploy();
    await nft.deployed();
    await nft.safeMint(owner.address,nftId1);
    await nft.safeMint(owner.address,nftId2);

    const DutchAution = await ethers.getContractFactory("DutchAuction");
    
    dutchAution = await DutchAution.deploy();
  })
  it("nft test",async function (){

    expect(await nft.ownerOf(nftId1)).to.equal(owner.address);

    expect(await nft.ownerOf(nftId2)).to.equal(owner.address);

  } )
  it("create ducth aution",async function () {
     //console.log("owner.address",owner.address);
     await nft.connect(owner).approve(dutchAution.address,nftId1);
     await nft.connect(owner).approve(dutchAution.address,nftId2);

    expect(await nft.getApproved(nftId1)).to.equal(dutchAution.address);
    expect(await nft.getApproved(nftId2)).to.equal(dutchAution.address);
    const startTime=Math.round(new Date().getTime()/1000);
    const endTime=startTime+60;
    await expect(dutchAution.connect(owner).createAuction(startTime,endTime, startPrice,reservedPrice, discountRate, nft.address,nftId1))
    .to.emit(dutchAution,"NewAuction")
    .withArgs(0,startTime,endTime,startPrice,reservedPrice,discountRate,nft.address,nftId1);
    await expect(dutchAution.connect(owner).createAuction(startTime,endTime, startPrice,reservedPrice, discountRate, nft.address,nftId2))
    .to.emit(dutchAution,"NewAuction")
    .withArgs(1,startTime,endTime,startPrice,reservedPrice,discountRate,nft.address,nftId2);

    //bid
    const price=await dutchAution.getCurrentPrice(0);
    const addr1Balance=await addr1.getBalance();
    
    await expect(dutchAution.connect(addr1).placeBid(0,{value:price})).
    to.emit(dutchAution,"NewBid")
    .withArgs(addr1.address,price);

    expect(await nft.ownerOf(nftId1)).to.equal(addr1.address);
    // const newAddr1Balance=await addr1.getBalance();
    // const bbb=addr1Balance.sub(ethers.utils.parseEther(price));
    // expect(newAddr1Balance.gt(bbb)).to.equal(true);
    await expect(dutchAution.connect(addr2).cancelAuction(1)).to.be.revertedWith('Not seller');
    await expect( dutchAution.connect(owner).cancelAuction(1))
    .to.emit(dutchAution,"AutionEnded")
    .withArgs(1,nft.address,nftId2,"0x0000000000000000000000000000000000000000");
    expect(await nft.ownerOf(nftId2)).to.equal(owner.address);
  })


});

