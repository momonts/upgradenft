require('dotenv').config({ path: '.env'});
require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');


const { PRIVATE_KEY } = process.env;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    core_testnet: {
      accounts: [PRIVATE_KEY],
      url: 'https://rpc.test2.btcs.network',
      chainId: 1114
    }
  }
};
