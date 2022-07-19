// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IAuction.sol";
library AutionTypes {
    struct Bid{
        address bidder;
        uint bid;
    }
    struct Auction{
        uint aucId;
        uint startTime;
        uint endTime; 
        uint startPrice;
        uint reservedPrice;
        uint discountRate; 
        address seller;
        address nftAddr; 
        uint tokenId; 
        uint highestBid;
        address highestBidder;
        bool closed;
        bool abortive;
    }
}
contract DutchAuction is IAuction,ReentrancyGuard{
    // address payable public immutable  seller;
    // IERC721 public immutable nft;
    // uint public immutable nftId;
    // uint public immutable startingPrice;
    // uint public immutable startTime;
    // uint public immutable expirationTime;
    
    // uint public immutable discountRate;
    using Counters for Counters.Counter;
    Counters.Counter private auctionId;
    AutionTypes.Auction[] private  auctions;
    mapping(uint=>AutionTypes.Bid[]) private bids; 
    function createAuction(uint _startTime,uint _endTime, uint _startPrice,uint _reservedPrice, uint _discountRate, address _nftAddr,uint _tokenId) external  {
        //require(block.timestamp >= _startTime, "start time is too early");
        uint diff = _endTime - _startTime;
        require(_startPrice >= _discountRate * diff, "ending price < 0");
        uint aucId = auctionId.current();
        uint startTime = _startTime;
        uint endTime = _endTime;
        auctions.push(AutionTypes.Auction(aucId,startTime,endTime,_startPrice,_reservedPrice,_discountRate,payable(msg.sender),_nftAddr,_tokenId,0,address(0),false,false));
        auctionId.increment();
        IERC721 nft = IERC721(_nftAddr);
        nft.transferFrom(msg.sender, address(this), _tokenId);
        emit NewAuction(aucId,startTime,endTime,_startPrice,_reservedPrice,_discountRate,_nftAddr,_tokenId);

    }

    
    modifier isValidAuction(uint autionId){
        require(autionId<=auctionId.current(),"Invalid ID");
        _;
    }

    // Place a bid on the auction
    function placeBid(uint autionId) external  payable override  isValidAuction(autionId) nonReentrant() {
        require(block.timestamp >= auctions[autionId].startTime, "Not open");
        require(block.timestamp <= auctions[autionId].endTime, "expired");
        require(!auctions[autionId].closed,"closed");
        uint currentprice=_currentPrice(autionId);
        require(msg.value >=currentprice ,"Insufficient eth");
        //bids[autionId].push(AutionTypes.Bid(msg.sender,msg.value));
        auctions[autionId].highestBid = msg.value; 
        auctions[autionId].highestBidder = msg.sender; 
        emit NewBid(msg.sender,msg.value); 
        if(msg.value>=auctions[autionId].reservedPrice){
            IERC721(auctions[autionId].nftAddr).transferFrom(address(this), msg.sender, auctions[autionId].tokenId);
            payable(auctions[autionId].seller).transfer(msg.value);
            emit AutionEnded(autionId,auctions[autionId].nftAddr,auctions[autionId].tokenId,msg.sender);
            
        }else{
            IERC721(auctions[autionId].nftAddr).transferFrom(address(this), auctions[autionId].seller, auctions[autionId].tokenId);
            payable(msg.sender).transfer(msg.value);
            auctions[autionId].abortive=true;
            emit AutionEnded(autionId,auctions[autionId].nftAddr,auctions[autionId].tokenId,address(0));
        }
        auctions[autionId].closed=true;
        
    }

    // Withdraw the token after the auction is over
    function withdrawToken(uint autionId) external override isValidAuction(autionId) nonReentrant() {
        require(block.timestamp > auctions[autionId].endTime || auctions[autionId].closed,"Aution not ending");  
        require(auctions[autionId].abortive,"Token has been returned");
        IERC721(auctions[autionId].nftAddr).transferFrom(address(this), auctions[autionId].seller, auctions[autionId].tokenId);
    }

    function cancelAuction(uint autionId) external override isValidAuction(autionId)  nonReentrant(){ // Cancel the auction
        require(msg.sender == auctions[autionId].seller,"Not seller"); 
        require(!auctions[autionId].closed,"closed");
        auctions[autionId].abortive=true;
        auctions[autionId].closed=true;
        IERC721(auctions[autionId].nftAddr).transferFrom(address(this), auctions[autionId].seller, auctions[autionId].tokenId); 

        
        emit AutionEnded(autionId,auctions[autionId].nftAddr,auctions[autionId].tokenId,address(0));
    } 


     function getStartTime(uint autionId) external override isValidAuction(autionId) view returns(uint){
        return auctions[autionId].startTime;
    }
    function getEndTime(uint autionId) external override isValidAuction(autionId) view returns(uint){
        return auctions[autionId].endTime;
    }
    function getStartPrice(uint autionId) external override isValidAuction(autionId) view returns(uint){
        return auctions[autionId].startPrice;
    }
    function getCurrentPrice(uint autionId) external override isValidAuction(autionId) view returns(uint){
        return _currentPrice(autionId);
        
    }
    function getReservedPrice(uint autionId) external  isValidAuction(autionId) view returns(uint){
        return auctions[autionId].reservedPrice;
    }
    function getdecreaseRate(uint autionId) external  isValidAuction(autionId) view returns(uint){
        return auctions[autionId].discountRate;
    }
    function getCreator(uint autionId) external override isValidAuction(autionId) view returns(address){
        return auctions[autionId].seller;
    }
    function getNftAddress(uint autionId) external override isValidAuction(autionId) view returns(address){
        return auctions[autionId].nftAddr;
    }
    function getTokenId(uint autionId) external override isValidAuction(autionId) view returns(uint){
        return auctions[autionId].tokenId;
    }
    function getHighestBid(uint autionId) external override isValidAuction(autionId) view returns(uint){
        return auctions[autionId].highestBid;
    }
    function getHighestBidder(uint autionId) external override isValidAuction(autionId) view returns(address){
        return auctions[autionId].highestBidder;
    }

    function _currentPrice(uint autionId) internal view returns(uint){ 
        if(block.timestamp<auctions[autionId].startTime){
            return auctions[autionId].startPrice;
        }
        uint timeElapsed = block.timestamp - auctions[autionId].startTime;
        uint decreaseAmount = auctions[autionId].discountRate*timeElapsed;
        return auctions[autionId].startPrice - decreaseAmount;
    }

}