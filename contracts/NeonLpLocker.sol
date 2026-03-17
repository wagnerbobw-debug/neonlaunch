// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Minimal {
    function transfer(address to, uint256 value) external returns (bool);
}

contract NeonLpLocker {
    struct Lock {
        address pair;
        address beneficiary;
        uint256 amount;
        uint64  unlockAt;
        bool    withdrawn;
    }

    address public immutable factory;
    Lock[] public locks;

    event Locked(uint256 indexed lockId, address indexed pair, address indexed beneficiary, uint256 amount, uint64 unlockAt);
    event Withdrawn(uint256 indexed lockId, address indexed beneficiary, uint256 amount);

    modifier onlyFactory() {
        require(msg.sender == factory, "NOT_FACTORY");
        _;
    }

    constructor(address _factory) {
        require(_factory != address(0), "BAD_FACTORY");
        factory = _factory;
    }

    function lock(address pair, address beneficiary, uint256 amount, uint64 unlockAt) external onlyFactory returns (uint256 lockId) {
        require(pair != address(0) && beneficiary != address(0), "BAD_PARAMS");
        require(amount > 0, "NO_AMOUNT");
        locks.push(Lock({ pair: pair, beneficiary: beneficiary, amount: amount, unlockAt: unlockAt, withdrawn: false }));
        lockId = locks.length - 1;
        emit Locked(lockId, pair, beneficiary, amount, unlockAt);
    }

    function withdraw(uint256 lockId) external {
        Lock storage L = locks[lockId];
        require(!L.withdrawn, "ALREADY");
        require(msg.sender == L.beneficiary, "NOT_BENEFICIARY");
        require(block.timestamp >= L.unlockAt, "LOCKED");

        L.withdrawn = true;
        bool ok = IERC20Minimal(L.pair).transfer(L.beneficiary, L.amount);
        require(ok, "LP_TRANSFER_FAIL");
        emit Withdrawn(lockId, L.beneficiary, L.amount);
    }

    function locksCount() external view returns (uint256) { return locks.length; }
}