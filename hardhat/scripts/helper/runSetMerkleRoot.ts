import { ethers } from "hardhat";
import { 
    RecipientInfoType, 
    COMMON_VARIABLES_AND_FUNCTIONS,
    RAW_RECIPIENTS_INFO_JSON,
    PATH_TO_REACT_ROOT_RECIPIENTS_INFO_JSON,
 } from "../../settings";
import {
    transferERC20,
    getRelevantContracts,
    setRecipientsInfo,
} from "../../utils/contractUtils";

const {
    createMerkleTree,
    getClaimArguments,
} = COMMON_VARIABLES_AND_FUNCTIONS;

// Before executing this script, make sure that you set the new json file.
async function main() {
    const { erc20, distributer } = await getRelevantContracts();
    
    console.log("After changed the json file in hardhat folder, we're gonna reset the merkle root and reset the frontend json file");
    console.log("---------------------------------------");
    console.log("erc20 address is: ", erc20.address);
    console.log("distributer address is: ", distributer.address);

    const balance = await erc20.balanceOf(distributer.address);
    const tokenDecimals = await erc20.decimals();
    console.log(
        'Current contract balance:', 
        balance,
        'Decimals:',
        tokenDecimals
    );

    const recipientsInfo: RecipientInfoType[] | null 
        = RAW_RECIPIENTS_INFO_JSON.map(
            info => ({
                address: info.address,
                rewardAmountWithoutDecimals: info.amount,
                uniqueKey: info.uniqueKey
            })
        );

    const newMerkleTree = createMerkleTree({
        recipientsInfo,
        tokenDecimals,
    });

    const tx = await distributer.setMerkleRoot(newMerkleTree.getHexRoot());
    await tx.wait();

    const isClaimable = recipientsInfo.map(async (recipientInfo, index) => {
        const { address, amount, uniqueKey, hexProof } = getClaimArguments({
            merkleTree: newMerkleTree,
            recipientInfo,
            tokenDecimals
        });
        const [actualIsClaimable, _] = await distributer.getIsClaimable(
            address,
            amount,
            uniqueKey,
            hexProof,
        );
        console.log(
            'address', address, 'is', 
            actualIsClaimable ? 'claimable': 'not claimable',
            'for', amount.toNumber()
        );
    }); 
    await Promise.all(isClaimable);

    console.log(
        'Setting new address and amount map json in frontend',
        recipientsInfo
    );
    await setRecipientsInfo(
        recipientsInfo,
        `${__dirname}/./../../../frontend/src/recipientsInfo.json`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});