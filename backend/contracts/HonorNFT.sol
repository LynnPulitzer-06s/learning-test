// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HonorNFT - Non-transferable honor badge (simplified ERC721-like interface)
/// @notice Mints honor certificates for Top N students; supports common wallet query interfaces; transfers are disabled
contract HonorNFT {
    // Basic info
    string public name = "Honor NFT";
    string public symbol = "HONOR";

    // Contract owner
    address public owner;
    
    // Authorized minter (LearningTest contract)
    address public authorizedMinter;

    // Auto-increment tokenId counter starting at 1
    uint256 private _nextTokenId = 1;

    // tokenId => owner
    mapping(uint256 => address) private _owners;
    // owner => tokenId (max one per address)
    mapping(address => uint256) private _ownedToken;

    // ERC721 Transfer event (for compatibility/listeners)
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == authorizedMinter, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }
    
    /// @notice Set authorized minter (can be called by owner)
    function setAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinter = minter;
    }

    /// @notice Return address balance (0 or 1)
    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "Zero address");
        return _ownedToken[account] == 0 ? 0 : 1;
    }

    /// @notice Return tokenId owner
    function ownerOf(uint256 tokenId) public view returns (address) {
        address o = _owners[tokenId];
        require(o != address(0), "Nonexistent token");
        return o;
    }

    /// @notice Mint to target address (max 1 per address)
    function mint(address to) external onlyAuthorized returns (uint256 tokenId) {
        require(to != address(0), "Zero address");
        require(_ownedToken[to] == 0, "Already minted");
        tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        _ownedToken[to] = tokenId;
        emit Transfer(address(0), to, tokenId);
    }

    /// @notice Query tokenId for address (0 if not minted)
    function tokenIdOf(address account) external view returns (uint256) {
        return _ownedToken[account];
    }

    /// @notice Non-transferable: all transfer/approval interfaces are disabled
    function approve(address /*to*/, uint256 /*tokenId*/) external pure {
        revert("Non-transferable");
    }
    function getApproved(uint256 /*tokenId*/) external pure returns (address) {
        return address(0);
    }
    function setApprovalForAll(address /*operator*/, bool /*approved*/) external pure {
        revert("Non-transferable");
    }
    function isApprovedForAll(address /*owner_*/, address /*operator*/) external pure returns (bool) {
        return false;
    }
    function transferFrom(address /*from*/, address /*to*/, uint256 /*tokenId*/) external pure {
        revert("Non-transferable");
    }
    function safeTransferFrom(address /*from*/, address /*to*/, uint256 /*tokenId*/) external pure {
        revert("Non-transferable");
    }
    function safeTransferFrom(address /*from*/, address /*to*/, uint256 /*tokenId*/, bytes calldata /*data*/) external pure {
        revert("Non-transferable");
    }
}


