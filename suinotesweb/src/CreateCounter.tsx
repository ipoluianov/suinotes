import { Transaction } from "@mysten/sui/transactions";
import { Button, Container } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useCurrentAccount } from "@mysten/dapp-kit";


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

	// 0xfe7893e78d9ad5e78d0d0585e636521e366676ce547545d5629cc149cf9a50bc::snt::SNT

	// Define the USDC token type on Sui testnet
// This is the unique identifier for the USDC token on Sui
const USDC_TYPE = '0xfe7893e78d9ad5e78d0d0585e636521e366676ce547545d5629cc149cf9a50bc::snt::SNT';


	const create = async () => {
		if (!currentAccount) {
			return;
		}

		const tx = new Transaction();

		const { data: coins } = await suiClient.getCoins({
			owner: currentAccount.address,
			coinType: USDC_TYPE,
		  });

		  if (coins.length === 0) {
			console.log('No USDC coins found');
			return;
		  }

		console.log('coins', coins);

		let coinsIDs = coins.map((coin) => coin.coinObjectId);

		let coinsIDsFromSecondItem = coinsIDs.slice(1);

		const res = tx.mergeCoins(coins[0].coinObjectId, coinsIDsFromSecondItem);

		console.log('mergedCoin', res);

		const coin = tx.splitCoins(coins[0].coinObjectId, [2000000000n]);
		console.log('coin', coin);

		tx.moveCall({
			arguments: [coin],
			target: `${counterPackageId}::counter::create`,
		});

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
				},
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
				disabled={isSuccess || isPending}
			>
				{isSuccess || isPending ? <ClipLoader size={20} /> : "Create Counter"}
			</Button>
		</Container>
	);
}