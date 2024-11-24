import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import { useEffect, useState } from "react";
import { SuiObjectData } from "@mysten/sui/client";
import { TESTNET_COUNTER_FUND_ID } from "./constants";
import { Button, Container } from "@radix-ui/themes";
import { Transaction } from "@mysten/sui/transactions";

export function Fund() {
    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [isWaitingForTransaction, setIsWaitingForTransaction] = useState(false);


    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<SuiObjectData | null | undefined>(null);
    const reloadData = () => {
        setData(null);
        loadData();
    }

    const loadData = async () => {
        if (data != null) return;
        if (isLoading) return;
        setIsLoading(true);
        let id = TESTNET_COUNTER_FUND_ID;
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

        setIsLoading(false);
    }

    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            loadData();
        }, 100);
        return () => clearInterval(interval);
    });

    const withdraw = async () => {
        if (data == null) return;
        const tx = new Transaction();
        tx.moveCall({
            arguments: [tx.object(TESTNET_COUNTER_FUND_ID)],
            target: `${counterPackageId}::fund::withdraw`,
        });
        setIsWaitingForTransaction(true);
        signAndExecute(
            {
                transaction: tx,
            },
            {
                onSuccess: async (tx) => {
                    await suiClient.waitForTransaction({ digest: tx.digest });
                    setIsWaitingForTransaction(false);
                    reloadData();
                },
                onError: (err) => {
                    alert("Error: " + err.message);
                    setIsWaitingForTransaction(false);
                },
            },
        );
        reloadData();
    }

    let balance = 0;
    let counter = 0;

    if (data != null) {
        balance = parseInt(data.content.fields.balance);
        counter = parseInt(data.content.fields.counter);
    }

    return (
        <>
            <hr />
            <h1>FUND</h1>
            <Container>
                <Button onClick={reloadData}>Reload</Button>
                <Container>
                    {isLoading ? <h2>Loading...</h2> : <>
                        <h2>Balance: {balance}</h2>
                        <h2>Counter: {counter}</h2>
                    </>}
                </Container>
                <Button onClick={withdraw} disabled={isWaitingForTransaction}>
                    Withdraw
                </Button>
            </Container>
        </>
    );
}

