import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { Button, Container } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useCurrentAccount } from "@mysten/dapp-kit";
import type { WalletAccount } from '@mysten/wallet-standard';
import React from "react";
import { DError, makeError } from "./error.ts";
import { TESTNET_COUNTER_FUND_ID } from "./constants.ts";

export function CreateCounter({
	onCreated,
	visible,
}: {
	onCreated: (id: string) => void;
	visible: boolean;
}) {
	if (!visible) {
		return null;
	}
	const currentAccount = useCurrentAccount();
	const counterPackageId = useNetworkVariable("counterPackageId");
	const suiClient = useSuiClient();
	const {
		mutate: signAndExecute,
	} = useSignAndExecuteTransaction();

	const [isCreating, setIsCreating] = React.useState(false);

	const SNT_TYPE = '0x688d228d71ac725d9f308fa6be32d014df2a6756394bf950783c603723ada55::snt::SNT';

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

	const create = async () => {
		if (!currentAccount) {
			return;
		}

		const tx = new Transaction();

		const coin = await prepareCoin(currentAccount, tx, SNT_TYPE, 2000000000n);
		console.log('coin', coin);
		// if coin is a DError
		if ('errorMessage' in coin) {
			alert('Error: ' + coin.errorMessage);
			return;
		}

		let refAddress = currentAccount.address;

		tx.moveCall({
			arguments: [tx.object(TESTNET_COUNTER_FUND_ID), tx.pure.address(refAddress), coin],
			target: `${counterPackageId}::suinotes::create_note`,
		});

		setIsCreating(true);

		signAndExecute(
			{
				transaction: tx,
			},
			{
				onSuccess: async ({ digest }) => {
					const { effects } = await suiClient.waitForTransaction({
						digest: digest,
						options: {
							showEffects: true,
							showRawEffects: true,
						},
					});
					
					console.log('effects', effects);
					let createdObjects = effects?.created;
					if (!createdObjects || createdObjects.length === 0) {
						alert("No object created");
						setIsCreating(false);
						return;
					}

					// find object with type Counter
					for (let i = 0; i < createdObjects.length; i++) {
						const obj = createdObjects[i];

						// Get Object By ID
						const data = await suiClient.getObject({
							id: obj.reference.objectId,
							options: {
								showType: true,
							},
						});

						if (data.data?.type === `${counterPackageId}::suinotes::Note`) {
							onCreated(obj.reference.objectId);
							setIsCreating(false);
							return;
						}
					}
					alert("No Counter object created");
					setIsCreating(false);
				},
				onError: (error) => {
					alert("Error: " + error);
					setIsCreating(false);
				}

			},
		);
	}

	return (
		<Container>
			<Button
				size="3"
				onClick={() => {
					create();
				}}
				disabled={isCreating}
			>
				{isCreating ? <ClipLoader size={20} /> : "Create Note"}
			</Button>
		</Container>
	);
}