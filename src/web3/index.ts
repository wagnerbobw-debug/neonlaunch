import * as onchain from './onchain';

export const web3 = {
  connectWallet: onchain.connectWallet,
  getChainId: onchain.getChainId,
  ensureChain: onchain.ensureChain,
  getMinLiquidity: onchain.getMinLiquidity,
  getCreateFee: onchain.getCreateFee,
  getBalance: onchain.getBalance,
  createToken: onchain.createToken,
};