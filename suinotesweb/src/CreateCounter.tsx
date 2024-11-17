import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { Button, Container } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useCurrentAccount } from "@mysten/dapp-kit";
import type { WalletAccount } from '@mysten/wallet-standard';
import React from "react";


export function CreateCounter({
	onCreated,
}: {
	onCreated: (id: string) => void;
}) {
	const currentAccount = useCurrentAccount();
	const counterPackageId = useNetworkVariable("counterPackageId");
	const suiClient = useSuiClient();
	const {
		mutate: signAndExecute,
		isSuccess,
		isPending,
	} = useSignAndExecuteTransaction();

	const [isCreating, setIsCreating] = React.useState(false);

	const SNT_TYPE = '0xfe7893e78d9ad5e78d0d0585e636521e366676ce547545d5629cc149cf9a50bc::snt::SNT';

	const prepareCoin = async (account: WalletAccount, tx: Transaction, coinType: string, amount: number) : (TransactionResult | string) => {
		if (!account) {
			return "No account";
		}

		const coinSymbol = coinType.split('::')[2];

		const { data: coins } = await suiClient.getCoins({
			owner: account.address,
			coinType: coinType,
		});

		if (coins.length === 0) {
			return "No " + coinSymbol + " found";
		}

		let totalBalance = 0n;
		for (let i = 0; i < coins.length; i++) {
			let balanceAsBitInt = BigInt(coins[i].balance);
			totalBalance += balanceAsBitInt;
		}

		let totalBalanceAsFloat = parseFloat(totalBalance.toString()) / 1000000000;
		console.log('Total balance', totalBalanceAsFloat);

		if (totalBalance < amount) {
			console.log('Not enough balance');
			return "Not enough " + coinSymbol + " balance";
		}

		console.log('Coins found', coins);

		// Try to find a coin with enough amount

		// coin.balance is BitInt
		// let coinWithEnoughAmount = coins.find((coin) => coin.balance >= amount);
		let coinWithEnoughAmount = coins.find((coin) => BigInt(coin.balance) >= BigInt(amount));

		if (coinWithEnoughAmount) {
			const coin = tx.splitCoins(coinWithEnoughAmount.coinObjectId, [amount]);
			console.log('Coin with enough amount found', coinWithEnoughAmount);
			return coin;
		}

		// Merge all coins into the first coin
		let coinsIDs = coins.map((coin) => coin.coinObjectId);
		let coinsIDsFromSecondItem = coinsIDs.slice(1);
		const res = tx.mergeCoins(coins[0].coinObjectId, coinsIDsFromSecondItem);
		if (!res) {
			console.log('mergeCoins failed');
			return "";
		}
		const coin = tx.splitCoins(coins[0].coinObjectId, [amount]);

		return coin;
	}

	const create = async () => {
		if (!currentAccount) {
			return;
		}

		const tx = new Transaction();

		const coin = await prepareCoin(currentAccount, tx, SNT_TYPE, 2000000000);
		console.log('coin', coin);
		if (typeof coin === 'string') {
			//console.log('Cannot get coin');
			alert('Error: ' + coin);
			return;
		}

		tx.moveCall({
			arguments: [coin],
			target: `${counterPackageId}::counter::create`,
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
						},
					});

					onCreated(effects?.created?.[0]?.reference?.objectId!);
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
				{isCreating ? <ClipLoader size={20} /> : "Create Counter"}
			</Button>
		</Container>
	);
}