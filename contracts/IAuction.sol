// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
interface IAuction{

    function placeBid(uint autionId) external payable ;
    function cancelAuction(uint autionId) external ;
    function withdrawToken(uint autionId) external;


    function getStartTime(uint autionId) external  view returns(uint);
    function getEndTime(uint autionId) external view returns(uint);
    function getStartPrice(uint autionId) external view returns(uint);
    function getCurrentPrice(uint autionId) external  view returns(uint);


    function getCreator(uint autionId) external  view returns(address);
    function getNftAddress(uint autionId) external view returns(address);
    function getTokenId(uint autionId) external  view returns(uint);
    function getHighestBid(uint autionId) external view returns(uint);
    function getHighestBidder(uint autionId) external  view returns(address);

    event NewAuction(uint id,uint _startTime, uint _periodInHour, uint _startPrice,uint _reservedPrice, uint _decreaseRate, address _nftAddr,uint _tokenId);
    event NewBid(address bidder, uint bid); // A new bid was placed
    event AutionEnded(uint autionId,address nftAddr,uint id,address winner); // The auction winner withdrawed the token
    
    
}
