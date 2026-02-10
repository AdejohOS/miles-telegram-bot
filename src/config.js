export const ADMIN_ID = Number(process.env.ADMIN_ID);
export const ETH_ADDRESS = process.env.ETH_ADDRESS;

export const MIN_DEPOSIT_USD = 10;

export const DEPOSIT_WALLETS = {
  btc: {
    name: "Bitcoin (BTC)",
    address: process.env.BTC_ADDRESS,
  },
  usdt_trc20: {
    name: "USDT (TRC20)",
    address: process.env.USDT_TRC20_ADDRESS,
  },
  usdt_erc20: {
    name: "USDT (ERC20)",
    address: process.env.USDT_ERC20_ADDRESS,
  },
};

export const ADMIN_IDS = [8218519406, 7172601924, 1013037662];
