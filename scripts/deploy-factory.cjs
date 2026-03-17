// deploy-factory.cjs
// Usage (Sepolia):
//   npx hardhat run --network sepolia scripts/deploy-factory.cjs

const { ethers } = require("hardhat");

async function main() {
  // --- Netzwerk-abhängige Router ---
  // Sepolia (Uniswap V2-kompatibel, häufig genutzt)
  const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  // --- Treasury/Firmenkonto (für Launch-Gebühren) ---
  const TREASURY_ADDRESS = "0x69f85aFe8134c4192b4d6FB26414b8C1d5077717";

  // --- Testnet-freundliche Mindest-Liquidity (in ETH auf Sepolia) ---
  const MIN_LIQ = ethers.parseEther("0.01");

  // Optional: Vorab checken, ob an der Router-Adresse Code liegt
  const code = await ethers.provider.getCode(ROUTER_ADDRESS);
  if (code === "0x") {
    throw new Error(
      `Router address ${ROUTER_ADDRESS} has no contract code on this network!`
    );
  }

  // WICHTIG: Stelle sicher, dass die Factory mit (router, minLiquidityWei, treasury) konstruiert wird
  const Factory = await ethers.getContractFactory(
    "contracts/NeonLaunchFactory.sol:NeonLaunchFactory"
  );

  console.log("Deploying NeonLaunchFactory with params:");
  console.log("  router  :", ROUTER_ADDRESS);
  console.log("  minLiqu :", MIN_LIQ.toString(), "(wei)");
  console.log("  treasury:", TREASURY_ADDRESS);

  const factory = await Factory.deploy(ROUTER_ADDRESS, MIN_LIQ, TREASURY_ADDRESS);
  await factory.waitForDeployment();

  const factoryAddr = await factory.getAddress();
  console.log("NeonLaunchFactory deployed to:", factoryAddr);

  // Falls du im Constructor den Locker erzeugst (wie in meinem Patch),
  // kannst du ihn hier direkt auslesen:
  if (factory.target) {
    // Ethers v6: Contract.target == address
    console.log("Factory target        :", factory.target);
  }

  // Versuche, die Locker-Adresse (falls vorhanden) zu lesen
  try {
    const lockerAddr = await factory.locker();
    console.log("NeonLpLocker at       :", lockerAddr);
  } catch (_) {
    console.log(
      "NeonLpLocker getter not found (ok, falls deine Factory noch keine Locker-Instanz erstellt)."
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});