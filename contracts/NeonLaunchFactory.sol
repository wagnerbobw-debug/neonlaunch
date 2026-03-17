// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NeonToken.sol";
import "./NeonLpLocker.sol";

interface IPancakeRouterV2 {
    function factory() external view returns (address);
    function WETH() external view returns (address);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}

interface IPancakeFactoryV2 {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

contract NeonLaunchFactory {
    // --- Params ---
    uint256 public immutable minLiquidityWei;
    IPancakeRouterV2 public immutable router;
    IPancakeFactoryV2 public immutable dexFactory;

    // NEW: Treasury + Locker
    address public immutable treasury;
    NeonLpLocker public immutable locker;

    // 10% of supply into LP
    uint16 public constant LP_TOKEN_BPS = 1000; // 10%

    // Anti-bot params (MVP fixed)
    uint16 public constant TRADING_DELAY_BLOCKS = 2;
    uint16 public constant PROTECTION_BLOCKS    = 5;
    uint16 public constant MAX_TX_BPS           = 50;  // 0.50%
    bool   public constant COOLDOWN_1TX_PER_BLOCK = true;

    // Soft limit fee schedule (native coin)
    uint256 public constant FEE1 = 0.02 ether;
    uint256 public constant FEE2 = 0.05 ether;
    uint256 public constant FEE3 = 0.10 ether;
    uint256 public constant FEE4 = 0.20 ether;
    uint256 public constant WINDOW = 24 hours;

    // NEW: Default LP lock duration
    uint32  public constant DEFAULT_LOCK_DAYS = 90;

    struct CreateOptions {
        bool renounceOwnership;
        bool enableAntiBot;
        bool lpLockRequested; // MVP hint only -> now active
    }

    struct SoftLimitState {
        uint64 resetAt;
        uint8  count24h;
    }

    mapping(address => SoftLimitState) private _soft;

    event TokenCreated(
        address indexed creator,
        address indexed token,
        address indexed pair,
        uint256 totalSupply,
        uint256 liquidityWei,
        uint256 feeWei,
        uint256 launchBlock,
        uint256 protectionEndBlock,
        CreateOptions options
    );

    constructor(address routerAddress, uint256 _minLiquidityWei, address _treasury) {
        require(routerAddress != address(0), "BAD_ROUTER");
        require(_treasury != address(0), "BAD_TREASURY");
        router = IPancakeRouterV2(routerAddress);
        dexFactory = IPancakeFactoryV2(IPancakeRouterV2(routerAddress).factory());
        minLiquidityWei = _minLiquidityWei;
        treasury = _treasury;
        locker = new NeonLpLocker(address(this));
    }

    // ----- Views for UI -----
    function getSoftLimitState(address user) external view returns (uint64 resetAt, uint8 count24h) {
        SoftLimitState memory s = _soft[user];
        if (s.resetAt == 0) return (uint64(block.timestamp + WINDOW), 0);
        if (block.timestamp > s.resetAt) return (uint64(block.timestamp + WINDOW), 0);
        return (s.resetAt, s.count24h);
    }

    function getCreateFee(address user) public view returns (uint256) {
        SoftLimitState memory s = _soft[user];
        uint8 c = s.count24h;
        if (s.resetAt == 0 || block.timestamp > s.resetAt) c = 0;
        if (c == 0) return FEE1;
        if (c == 1) return FEE2;
        if (c == 2) return FEE3;
        return FEE4;
    }

    // ----- Main action -----
    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint256 liquidityWei,
        CreateOptions calldata options
    ) external payable returns (address token, address pair, uint256 liquidity) {
        require(liquidityWei >= minLiquidityWei, "LIQ_TOO_LOW");

        // compute & update fee state
        uint256 feeWei = _consumeFee(msg.sender);
        require(msg.value == feeWei + liquidityWei, "BAD_MSG_VALUE");

        // Forward fee to treasury immediately
        (bool okFee, ) = treasury.call{ value: feeWei }("");
        require(okFee, "FEE_XFER_FAIL");

        // anti-bot params depend on flag
        uint16 delayBlocks      = options.enableAntiBot ? TRADING_DELAY_BLOCKS    : 0;
        uint16 protectionBlocks = options.enableAntiBot ? PROTECTION_BLOCKS       : 0;
        uint16 maxTxBps         = options.enableAntiBot ? MAX_TX_BPS              : 10_000;
        bool cooldown           = options.enableAntiBot ? COOLDOWN_1TX_PER_BLOCK  : false;

        // Deploy token (pair unknown at this moment)
        NeonToken t = new NeonToken(
            name,
            symbol,
            totalSupply,
            msg.sender,        // owner = creator
            address(this),     // factory
            address(router),   // router
            delayBlocks,
            protectionBlocks,  // (ignored in constructor; used at launch set)
            maxTxBps,
            cooldown,
            options.renounceOwnership // NEW: factory may renounce later
        );
        token = address(t);

        // supply split: 10% LP, 90% creator
        uint256 lpTokens = (totalSupply * LP_TOKEN_BPS) / 10_000;
        uint256 creatorTokens = totalSupply - lpTokens;

        // transfer creator share (factory holds all supply initially)
        require(t.transfer(msg.sender, creatorTokens), "XFER_FAIL");

        // approve router for LP tokens
        require(t.approve(address(router), lpTokens), "APPROVE_FAIL");

        // add liquidity (token + native coin)
        address lpRecipient = options.lpLockRequested ? address(locker) : msg.sender;
        ( , , liquidity ) = router.addLiquidityETH{ value: liquidityWei }(
            token,
            lpTokens,
            0, // amountTokenMin
            0, // amountETHMin
            lpRecipient, // either locker or creator
            block.timestamp + 20 minutes
        );

        // pair address
        pair = dexFactory.getPair(token, router.WETH());

        // wire pair into token (needed for cooldown correctness)
        t.setPair(pair);

        // enable trading
        uint256 launchBlock = block.number;
        t.setLaunchBlock(launchBlock, protectionBlocks);
        uint256 protectionEnd = t.protectionEndBlock();

        // LP lock record (if requested)
        if (options.lpLockRequested) {
            uint64 unlockAt = uint64(block.timestamp + uint256(DEFAULT_LOCK_DAYS) * 1 days);
            locker.lock(pair, msg.sender, liquidity, unlockAt);
        }

        // Auto-renounce (if requested)
        if (options.renounceOwnership) {
            t.factoryRenounce();
        }

        emit TokenCreated(
            msg.sender,
            token,
            pair,
            totalSupply,
            liquidityWei,
            feeWei,
            launchBlock,
            protectionEnd,
            options
        );
    }

    function _consumeFee(address user) internal returns (uint256 feeWei) {
        SoftLimitState storage s = _soft[user];
        if (s.resetAt == 0 || block.timestamp > s.resetAt) {
            s.resetAt = uint64(block.timestamp + WINDOW);
            s.count24h = 0;
        }
        feeWei = getCreateFee(user);
        s.count24h += 1;
    }

    receive() external payable {}
}
