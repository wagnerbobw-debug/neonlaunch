// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);
    function allowance(address o, address s) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

abstract contract Ownable {
    address public owner;
    event OwnershipTransferred(address indexed prev, address indexed next);

    modifier onlyOwner() { require(msg.sender == owner, "NOT_OWNER"); _; }

    constructor(address _owner) { owner = _owner; emit OwnershipTransferred(address(0), _owner); }

    function renounceOwnership() external onlyOwner {
        owner = address(0);
        emit OwnershipTransferred(msg.sender, address(0));
    }
}

contract NeonToken is IERC20, Ownable {
    string public name;
    string public symbol;
    uint8  public constant decimals = 18;

    uint256 private _totalSupply;
    mapping(address => uint256) private _bal;
    mapping(address => mapping(address => uint256)) private _allow;

    // --- Anti-bot state ---
    uint256 public launchBlock;
    uint256 public protectionEndBlock;
    uint16  public tradingDelayBlocks;
    uint16  public maxTxBps;
    bool    public cooldownOneTxPerBlock;

    mapping(address => bool) public isExempt;
    mapping(address => uint256) public lastTransferBlock;

    // --- NEW: addresses we need ---
    address public factory;
    address public router;
    address public pair; // set after addLiquidity

    error TradingNotEnabled();
    error TradingDelayActive();
    error MaxTxActive();
    error CooldownActive();

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 supply,
        address initialOwner,
        address _factory,
        address _router,
        uint16 _delayBlocks,
        uint16 /* _protectionBlocks */, // not needed here; we pass it to setLaunchBlock
        uint16 _maxTxBps,
        bool _cooldown
    ) Ownable(initialOwner) {
        name = _name;
        symbol = _symbol;

        factory = _factory;
        router = _router;

        // mint to factory initially
        _mint(factory, supply);

        tradingDelayBlocks = _delayBlocks;
        maxTxBps = _maxTxBps;
        cooldownOneTxPerBlock = _cooldown;

        // exemptions
        isExempt[factory] = true;
        isExempt[router]  = true;
        isExempt[address(0)] = true;
    }

    // NEW: set pair once liquidity created
    function setPair(address _pair) external {
        require(msg.sender == factory, "NOT_FACTORY");
        require(pair == address(0), "PAIR_ALREADY_SET");
        require(_pair != address(0), "BAD_PAIR");
        pair = _pair;
    }

    function setLaunchBlock(uint256 _launchBlock, uint16 protectionBlocks) external {
        require(msg.sender == factory, "NOT_FACTORY");
        if (launchBlock == 0) {
            launchBlock = _launchBlock;
            protectionEndBlock = _launchBlock + tradingDelayBlocks + protectionBlocks;
        }
    }

    // ---- ERC20 ----
    function totalSupply() external view returns (uint256) { return _totalSupply; }
    function balanceOf(address who) external view returns (uint256) { return _bal[who]; }
    function allowance(address o, address s) external view returns (uint256) { return _allow[o][s]; }

    function approve(address spender, uint256 value) external returns (bool) {
        _allow[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 a = _allow[from][msg.sender];
        require(a >= value, "ALLOWANCE");
        _allow[from][msg.sender] = a - value;
        _transfer(from, to, value);
        return true;
    }

    function _mint(address to, uint256 value) internal {
        _totalSupply += value;
        _bal[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(_bal[from] >= value, "BALANCE");

        // Anti-bot only if neither side exempt
        if (!isExempt[from] && !isExempt[to]) {
            if (launchBlock == 0) revert TradingNotEnabled();

            // delay window
            if (block.number <= launchBlock + tradingDelayBlocks) revert TradingDelayActive();

            // protection window
            if (block.number <= protectionEndBlock) {
                uint256 maxTx = (_totalSupply * maxTxBps) / 10_000;
                if (value > maxTx) revert MaxTxActive();

                if (cooldownOneTxPerBlock) {
                    // FIX: on buys (from == pair) cooldown per receiver, not per pair
                    address cooldownKey = (pair != address(0) && from == pair) ? to : from;

                    if (lastTransferBlock[cooldownKey] == block.number) revert CooldownActive();
                    lastTransferBlock[cooldownKey] = block.number;
                }
            }
        }

        _bal[from] -= value;
        _bal[to] += value;
        emit Transfer(from, to, value);
    }
}