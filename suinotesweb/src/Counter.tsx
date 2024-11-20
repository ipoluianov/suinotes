import {

    useSignAndExecuteTransaction,
    useSuiClient,
    

} from "@mysten/dapp-kit";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import type { SuiObjectData } from "@mysten/sui/client";
import { Button, Flex, Heading } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { shortAddress } from "./utils";
import { decryptMessage, encryptMessage } from "./aes";
import { makeError } from "./error";
import type { WalletAccount } from '@mysten/wallet-standard';
import { useCurrentAccount } from "@mysten/dapp-kit";


export function Counter({
    id,
    visible,
    onBack
}:
    {
        id: (string | null);
        visible: boolean;
        onBack: () => void;
    }) {

    if (!visible) {
        return null;
    }

    const SNT_TYPE = '0xfe7893e78d9ad5e78d0d0585e636521e366676ce547545d5629cc149cf9a50bc::snt::SNT';


	const currentAccount = useCurrentAccount();
    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const [isWaitingForTransaction, setIsWaitingForTransaction] = useState(false);
    const [latestId, setLatestId] = useState<string>("");

    const [data, setData] = useState<SuiObjectData | null | undefined>(null);
    const reloadData = () => {
        setData(null);
        loadData();
    }

    const loadData = async () => {
        if (id == null) return;
        if (data != null) return;
        if (isLoading) return;
        setIsLoading(true);
        const result = await suiClient.getObject({
            id,
            options: {
                showContent: true,
                showOwner: true,
            },
        });
        console.log("Data: ", result);
        setData(result.data);
        if (result.data == null) {
            setIsLoading(false);
            return;
        }

        let key = "key";
        while (key.length < 32) {
            key += "0";
        }
        console.log("Key: ", key);

        let encryptedData = getCounterFields(result.data)?.text;
        if (encryptedData == null) {
            setTextToSet("");
            setIsLoading(false);
            return;
        }
        let decryptedData = "";
        try {
            decryptedData = await decryptMessage(encryptedData, key);
        } catch (e) {
            console.log("Error: ", e);
        }

        setTextToSet(decryptedData);
        setIsLoading(false);
    }

    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            if (id == null) return;
            if (id != latestId) {
                setLatestId(id);
                reloadData();
                return;
            }
            loadData();
        }, 100);
        return () => clearInterval(interval);
    });

    const [textToSet, setTextToSet] = useState("");

    const [waitingForTxn, setWaitingForTxn] = useState("");

    const prepareCoin = async (account: WalletAccount, tx: Transaction, coinType: string, amount: bigint): (Promise<TransactionResult | DError>) => {
		if (!account) {
			return makeError("No account");
		}

		const coinTypeParts = coinType.split('::');
		if (coinTypeParts.length !== 3) {
			return makeError("Invalid coin type");
		}

		const coinSymbol = coinType.split('::')[2];

		const { data: coins } = await suiClient.getCoins({
			owner: account.address,
			coinType: coinType,
		});

		if (coins.length === 0) {
			return makeError("No " + coinSymbol + " found");
		}

		let totalBalance = 0n;
		for (let i = 0; i < coins.length; i++) {
			let balanceAsBitInt = BigInt(coins[i].balance);
			totalBalance += balanceAsBitInt;
		}

		//let totalBalanceAsFloat = parseFloat(totalBalance.toString()) / 1000000000;
		if (BigInt(totalBalance) < amount) {
			console.log('Not enough balance');
			return makeError("Not enough " + coinSymbol + " balance");
		}

		console.log('Coins found', coins);

		// Try to find a coin with enough amount
		let coinWithEnoughAmount = coins.find((coin) => BigInt(coin.balance) >= BigInt(amount));
		if (coinWithEnoughAmount) {
			const coin = tx.splitCoins(coinWithEnoughAmount.coinObjectId, [amount]);
			return coin;
		}

		// Merge all coins into the first coin
		let coinsIDs = coins.map((coin) => coin.coinObjectId);
		let coinsIDsFromSecondItem = coinsIDs.slice(1);
		tx.mergeCoins(coins[0].coinObjectId, coinsIDsFromSecondItem);
		const coin = tx.splitCoins(coins[0].coinObjectId, [amount]);
		return coin;
	}


    const suiCallSetValue = async () => {
        let key = "key";
        while (key.length < 32) {
            key += "0";
        }
        console.log("Key: ", key);

        let encryptedData = "";
        if (id == null) return;
        try {
            let dataToEncrypt = textToSet;
            encryptedData = await encryptMessage(dataToEncrypt, key);
        } catch (e) {
            console.log("Error: ", e);
            alert("Error: " + e);
            return;
        }

        console.log("Encrypted data: ", encryptedData);

        setWaitingForTxn("set_value");
        setIsWaitingForTransaction(true);

        const tx = new Transaction();
        const coin = await prepareCoin(currentAccount, tx, SNT_TYPE, 2000000000n);
		console.log('coin', coin);

        tx.moveCall({
            arguments: [coin, tx.object(id), tx.pure.string(encryptedData)],
            target: `${counterPackageId}::suinotes::set_value`,
        });

        signAndExecute(
            {
                transaction: tx,
            },
            {
                onSuccess: async (tx) => {
                    await suiClient.waitForTransaction({ digest: tx.digest });
                    setWaitingForTxn("");
                    setIsWaitingForTransaction(false);
                    reloadData();
                },
                onError: (err) => {
                    alert("Error: " + err.message);
                    setWaitingForTxn("");
                    setIsWaitingForTransaction(false);
                },
            },
        );
    };

    let isDisabled = false;
    if (isWaitingForTransaction || isLoading || data == null) {
        isDisabled = true;
    }

    const copyIdToClipboard = () => {
        if (id == null) return;
        navigator.clipboard.writeText(id);
    }

    const openInBlockExploter = () => {
        if (id == null) return;
        window.open(`https://suiscan.xyz/testnet/object/${id}`, "_blank");
    }
   
    return (
        <>
            <Heading size="3">Note {shortAddress(id)} 
                <Button onClick={()=>{copyIdToClipboard()}}>COPY</Button>
                <Button onClick={()=>{openInBlockExploter()}}>SUI SCAN</Button>
                </Heading>

            <Flex direction="column" gap="2">
                <Flex direction="row">
                    <Button
                        style={{ marginRight: '12px' }}
                        onClick={() => { onBack(); }}
                    >
                        MY NOTES
                    </Button>

                </Flex>
                <Flex direction="column" gap="2">
                    <textarea disabled={isDisabled}
                        value={textToSet}
                        onChange={(e) => setTextToSet(e.target.value)} placeholder="Note content"
                        style={{ width: '100%', height: '300px' }}
                    />
                    <Flex direction="row">
                        <Button
                            style={{ marginRight: '12px' }}
                            onClick={() => suiCallSetValue()}
                            disabled={waitingForTxn !== ""}
                        >
                            {waitingForTxn === "set_value" ? (
                                <ClipLoader size={20} />
                            ) : (
                                "SET TEXT"
                            )}
                        </Button>
                        <Button
                            style={{ marginRight: '12px' }}
                            onClick={() => { reloadData(); }}
                        >
                            RELOAD
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
        </>
    );
}

function getCounterFields(data: SuiObjectData) {
    if (data.content?.dataType !== "moveObject") {
        return null;
    }

    return data.content.fields as { text: string };
}
