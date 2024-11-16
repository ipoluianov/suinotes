import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient,
    useSuiClientQuery,
} from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

export function Counter({ id }: { id: string }) {
    const counterPackageId = useNetworkVariable("counterPackageId");
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
        id,
        options: {
            showContent: true,
            showOwner: true,
        },
    });

    const [currentError, setCurrentError] = useState("");
    const [textToSet, setTextToSet] = useState("");

    const [waitingForTxn, setWaitingForTxn] = useState("");

    const executeMoveCall = (method: "set_value") => {
        setWaitingForTxn(method);

        const tx = new Transaction();
        tx.moveCall({
            arguments: [tx.object(id), tx.pure.string(textToSet)],
            target: `${counterPackageId}::counter::set_value`,
        });

        signAndExecute(
            {
                transaction: tx,
            },
            {
                onSuccess: (tx) => {
                    suiClient.waitForTransaction({ digest: tx.digest }).then(async () => {
                        await refetch();
                    });
                    setWaitingForTxn("");
                    setCurrentError("");
                },
                onError: (err) => {
                    setWaitingForTxn("");
                    setCurrentError(err.message);
                    //alert("Error " + err.message);
                    console.log("Error " + err.message);
                },
            },
        );
    };

    if (isPending) return <Text>Loading...</Text>;

    if (error) return <Text>Error: {error.message}</Text>;

    if (!data.data) return <Text>Not found</Text>;

    let objVersion = data.data.version;
    let objVersionNum = parseInt(objVersion, 10);
    let objVersionHex = objVersionNum.toString(16);


    return (
        <>
            <Heading size="3">Note {id}</Heading>

            <Flex direction="column" gap="2">
                <Text style={{fontSize: '36pt'}}>[{getCounterFields(data.data)?.text}]</Text>
                <Text>
                    Object Version: {data.data.version} Hex: {objVersionHex}
                </Text>
                <Flex direction="row" gap="2">
                    <input value={textToSet} onChange={(e) => setTextToSet(e.target.value)} placeholder="Text To Set" />
                    <Button
                        onClick={() => executeMoveCall("set_value")}
                        disabled={waitingForTxn !== ""}
                    >
                        {waitingForTxn === "set_value" ? (
                            <ClipLoader size={20} />
                        ) : (
                            "SET TEXT"
                        )}
                    </Button>
                </Flex>
            </Flex>
            <Text>{currentError}</Text>
            <div style={{ margin: '10px' }}>
                <Button onClick={() => { setCurrentError("") }}>Reset Error</Button>
            </div>
        </>
    );
}

function getCounterFields(data: SuiObjectData) {
    if (data.content?.dataType !== "moveObject") {
        return null;
    }

    return data.content.fields as { text: string };
}
