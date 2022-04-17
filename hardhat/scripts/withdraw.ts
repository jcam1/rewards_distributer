import type { RecipientInfoType } from "../settings";

import {
    formatERC20Amount,
    initialDeployAndCreateMerkleTree,
    transferERC20,
    mintSimpleToken,
    setEnv,
    setRecipientsInfo,
    ERC20_CONTRACT_ADDRESS,
    getContractAddress
} from "../utils/contractUtils";
import { ethers, network } from "hardhat";
import {
    PATH_TO_HARDHAT_ENV,
    PATH_TO_FRONTEND_ENV,
    RAW_RECIPIENTS_INFO_JSON,
    PATH_TO_REACT_ROOT_RECIPIENTS_INFO_JSON,
    ENV
} from "../settings";
import { COMMON_VARIABLES_AND_FUNCTIONS } from "../settings";

const {
    getClaimArguments,
    ENV_PREFIX_REACT_APP,
    ENV_DISTRIBUTER_CONTRACT_ADDRESS,
} = COMMON_VARIABLES_AND_FUNCTIONS;

import {
    ERC20__factory as ERC20Factory,
    SimpleMerkleDistributer__factory as DistributerFactory,
    TestSimpleMerkleDistributerV2__factory as TestUpgradeableMerkleDistributerV2Factory,
    SimpleToken__factory as SimpleTokenFactory,
} from '../typechain';

/*
 * This script withdraw all the balances of the token deposited into the contract beforehand
 */
async function main() {
  
    // get the current using contract addresses
    const {
        ERC20_CONTRACT_ADDRESS,
        DISTRIBUTER_CONTRACT_ADDRESS,
    } = getContractAddress();

    console.log(`##### This script is gonna withdraw USDC from contract ${DISTRIBUTER_CONTRACT_ADDRESS} on ${network.name}`);
    console.log(`##### USDC's contract is ${ERC20_CONTRACT_ADDRESS} on ${network.name}`);
    // signers
    const [owner] = await ethers.getSigners();

    // make sure the contract address is not null
    if (DISTRIBUTER_CONTRACT_ADDRESS == null) {
        throw new Error('Distributer contracts address are not legit');
    }
    if (ERC20_CONTRACT_ADDRESS == null) {
        throw new Error('ERC20 contracts address are not legit');
    }
    
    // getContract
    const Distributer = new DistributerFactory(owner);
    const distributer = Distributer.attach(DISTRIBUTER_CONTRACT_ADDRESS); 
    // const targetERC20 = ERC20Factory.connect(ERC20_CONTRACT_ADDRESS, owner);
    const targetERC20 = (new ERC20Factory(owner)).attach(ERC20_CONTRACT_ADDRESS);

    // show the balance
    const balance = await targetERC20.balanceOf(distributer.address)

    console.log(`---------------`)
    console.log(`#### the USDC balacne of conract is: `)
    console.log(`${(balance).toString()}/10^6`)
    console.log(`---------------`)
    // do the Withdraw
    console.log(`#### Withdrawing the token... `)
    const claimAllDepositsTx = await distributer.connect(owner).claimAllDiposits()
    await claimAllDepositsTx.wait()
    console.log(claimAllDepositsTx)
    console.log("#### Withdrawal is finished")
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
