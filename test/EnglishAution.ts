import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
//const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');
//const[owner,addr1,addr2]=accounts
const nftId1=111;
const nftId2=6666;
const startPrice=100;
const reservedPrice=150;
const minIncrement=10;

describe("English aution test", function () {
  let nft:Contract;
  let englishAution:Contract;
  let owner:SignerWithAddress,addr1:SignerWithAddress,addr2:SignerWithAddress;
  beforeEach("deploy nft contract",async function () {
    [owner,addr1,addr2] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("CollectionTTT");
    
    nft = await NFT.deploy();
    await nft.deployed();
    await nft.safeMint(owner.address,nftId1);
    await nft.safeMint(owner.address,nftId2);

    const EnglishAution = await ethers.getContractFactory("EnglishAuction");
    
    englishAution = await EnglishAution.deploy();
  })
  it("nft test",async function (){

    expect(await nft.ownerOf(nftId1)).to.equal(owner.address);

    expect(await nft.ownerOf(nftId2)).to.equal(owner.address);

  } )
  it("create english aution",async function () {
     //console.log("owner.address",owner.address);
     await nft.connect(owner).approve(englishAution.address,nftId1);
     await nft.connect(owner).approve(englishAution.address,nftId2);

    expect(await nft.getApproved(nftId1)).to.equal(englishAution.address);
    expect(await nft.getApproved(nftId2)).to.equal(englishAution.address);
    const startTime=Math.round(new Date().getTime()/1000);
    const endTime=startTime+60;
    await expect(englishAution.connect(owner).createAuction(startTime,endTime, startPrice,reservedPrice, minIncrement, nft.address,nftId1))
    .to.emit(englishAution,"NewAuction")
    .withArgs(0,startTime,endTime,startPrice,reservedPrice,minIncrement,nft.address,nftId1);
    await expect(englishAution.connect(owner).createAuction(startTime,endTime, startPrice,reservedPrice, minIncrement, nft.address,nftId2))
    .to.emit(englishAution,"NewAuction")
    .withArgs(1,startTime,endTime,startPrice,reservedPrice,minIncrement,nft.address,nftId2);

    //bid
     let price=await englishAution.getCurrentPrice(0);
    const minIncrement1=await englishAution.getMinIncrement(0);
    const bidPrice1=price+minIncrement1;
    await expect(englishAution.connect(addr1).placeBid(0,{value:bidPrice1})).
    to.emit(englishAution,"NewBid")
    .withArgs(addr1.address,bidPrice1);

    price=await englishAution.getCurrentPrice(0);
    await expect(englishAution.connect(addr2).placeBid(0,{value:price+100})).
    to.emit(englishAution,"NewBid")
    .withArgs(addr2.address,price+100);

    await expect(englishAution.connect(addr2).cancelAuction(0)).to.be.revertedWith('Not seller');
    await expect(englishAution.connect(owner).cancelAuction(0)).to.be.revertedWith('reserved price is met');

    // const newAddr1Balance=await addr1.getBalance();
    // const bbb=addr1Balance.sub(ethers.utils.parseEther(price));
    // expect(newAddr1Balance.gt(bbb)).to.equal(true);
    // await expect(englishAution.connect(addr2).cancelAuction(1)).to.be.revertedWith('Not seller');
    // await expect( englishAution.connect(owner).cancelAuction(1))
    // .to.emit(englishAution,"AutionEnded")
    // .withArgs(1,nft.address,nftId2,"0x0000000000000000000000000000000000000000");
    // expect(await nft.ownerOf(nftId2)).to.equal(owner.address);
  })


});

