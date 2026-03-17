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

    constructor(address _owner) {
        owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    function renounceOwnership() external onlyOwner {
        _renounceOwnership();
    }

    // NEW: internal renounce to allow factory-hook
    function _renounceOwnership() internal {
        address prev = owner;
        owner = address(0);
        emit OwnershipTransferred(prev, address(0));
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

    // --- AMM pairs (multi-pair support) ---
    address public pair; // legacy primary pair (set once)
    mapping(address => bool) public isAMMPair;

    // --- wired by factory ---
    address public factory;
    address public router;
    bool    public factoryMayRenounce;

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
        uint16 /* _protectionBlocks */,
        uint16 _maxTxBps,
        bool _cooldown,
        bool _factoryMayRenounce // NEW
    ) Ownable(initialOwner) {
        name = _name;
        symbol = _symbol;

        factory = _factory;
        router  = _router;
        factoryMayRenounce = _factoryMayRenounce;

        // mint to factory initially (factory distributes later)
        _mint(factory, supply);

        tradingDelayBlocks = _delayBlocks;
        maxTxBps = _maxTxBps;
        cooldownOneTxPerBlock = _cooldown;

        // exemptions
        isExempt[factory] = true;
        isExempt[router]  = true;
    }

    // Factory sets pair AFTER liquidity is added
    function setPair(address _pair) external {
        require(msg.sender == factory, "NOT_FACTORY");
        require(_pair != address(0), "BAD_PAIR");
        if (pair == address(0)) {
            pair = _pair; // keep legacy primary pair
        }
        isAMMPair[_pair] = true;
    }

    function setLaunchBlock(uint256 _launchBlock, uint16 protectionBlocks) external {
        require(msg.sender == factory, "NOT_FACTORY");
        if (launchBlock == 0) {
            launchBlock = _launchBlock;
            protectionEndBlock = _launchBlock + tradingDelayBlocks + protectionBlocks;
        }
    }

    // NEW: factory-driven renounce (only if allowed at deploy)
    function factoryRenounce() external {
        require(msg.sender == factory && factoryMayRenounce, "NOT_ALLOWED");
        _renounceOwnership();
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

    // NEW: explicit burn with supply decrease
    function burn(uint256 value) external {
        uint256 b = _bal[msg.sender];
        require(b >= value, "BALANCE");
        _bal[msg.sender] = b - value;
        _totalSupply -= value;
        emit Transfer(msg.sender, address(0), value);
    }

    function _mint(address to, uint256 value) internal {
        _totalSupply += value;
        _bal[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "ZERO_ADDR");
        require(_bal[from] >= value, "BALANCE");

        // Anti-bot only if neither side is exempt
        if (!isExempt[from] && !isExempt[to]) {
            if (launchBlock == 0) revert TradingNotEnabled();

            if (block.number <= launchBlock + tradingDelayBlocks)
                revert TradingDelayActive();

            if (block.number <= protectionEndBlock) {
                uint256 maxTx = (_totalSupply * maxTxBps) / 10_000;
                if (value > maxTx) revert MaxTxActive();

                if (cooldownOneTxPerBlock) {
                    bool isBuy = isAMMPair[from];
                    address cooldownKey = isBuy ? to : from;
                    if (lastTransferBlock[cooldownKey] == block.number)
                        revert CooldownActive();
                    lastTransferBlock[cooldownKey] = block.number;
                }
            }
        }

        _bal[from] -= value;
        _bal[to] += value;
        emit Transfer(from, to, value);
    }
}