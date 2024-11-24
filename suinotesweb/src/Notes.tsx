import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useSignPersonalMessage } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";

export function Notes({
    onSelected,
    visible,
}: {
    onSelected: (id: string) => void;
    visible: boolean;
}) {
    if (!visible) {
        return null;
    }

    const counterPackageId = useNetworkVariable("counterPackageId");
    const account = useCurrentAccount();
    let currentAddress = "";
    console.log("gettings current account", account);
    if (account != null) {
        console.log("ACCOUNT: ", account.address);
        currentAddress = account.address;
    }
    let suiClient = useSuiClient();

    const [objects, setObjects] = useState<string[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);

    //const [currentAddress, setCurrentAddress] = useState<string>("");


    let count = 5;

    const getObjectsByType = async (typeOfObject: string): Promise<string[]> => {
        let result: string[] = [];
        try {
            console.log("GET OBJECTS BY TYPE", typeOfObject);
            count = 0;
            let nextPageId: (string | undefined) = undefined;
            nextPageId = await loadObjects(nextPageId, typeOfObject, result);
            while (nextPageId !== null && nextPageId !== undefined && nextPageId !== "") {
                console.log("NEXT PAGE ID: ", nextPageId);
                nextPageId = await loadObjects(nextPageId, typeOfObject, result);
                count++;
                if (count > 5) {
                    console.log("COUNT EXCEEDED");
                    break;
                }
            }
            setLoaded(true);
        } catch (e) {
            console.log("ERROR: ", e);
            return [];
        }
        console.log("RESULT: ", result);
        return result;
    }

    const loadObjects = async (pageId: string | undefined, typeOfObject: string, result: string[]): Promise<string | undefined> => {
        console.log("LOADING OBJECTS", pageId, count);
        if (count > 10) {
            console.log("COUNT EXCEEDED");
            throw new Error("Count exceeded");
        }

        if (currentAddress === "") {
            console.log("NO ADDRESS", currentAddress, "---");
            throw new Error("No address");
        }

        let response = await suiClient.getOwnedObjects({
            owner: currentAddress,
            cursor: pageId,
            options: {
                showType: true,
                //showContent: true,
            },
        })

        for (let i = 0; i < response.data.length; i++) {
            //console.log(response.data[i].data?.type);
            if (response.data[i].data?.type === typeOfObject) {
                result.push(response.data[i].data?.objectId);
            }
        }

        if (response.hasNextPage) {
            if (response.nextCursor != null) {
                return response.nextCursor;
            }
        }

        return "";
    }

    const loadData = () => {
        if (loaded) {
            return;
        }
        console.log("loadData");
        //setLoading(true);
        try {
            getObjectsByType(counterPackageId + "::suinotes::Note").then((result) => {
                console.log("1RESULT: ", result);
                setObjects(result);
                //setLoading(false);
            });
        } catch (e) {
            console.log("ERROR: ", e);
            //setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            loadData();
        }, 1000);
        return () => clearInterval(interval);
    });

    /*if (!account) {
        return;
    }

    if (error) {
        return <Flex>Error: {error.message}</Flex>;
    }

    if (isPending || !data) {
        return <Flex>Loading...</Flex>;
    }

    let objects = [];
    console.log("COUNT OF OBJECTS: ", data.data.length, data.nextCursor);

    for (let i = 0; i < data.data.length; i++) {
        //console.log(data.data[i].data.type, counterPackageId);
        if (data.data[i].data?.type?.indexOf(counterPackageId) === 0) {
            objects.push(data.data[i].data);
            //console.log("Object FOUND ---------------------------------------");
        }
    }

    console.log("Objects: ", objects);
*/
    const setCurrentObjectId = (objectId: string | undefined) => {
        if (objectId === undefined) {
            return;
        }
        onSelected(objectId);
    }

    //return (<div>sadadsad</div>);


    return (
        <Flex direction="column" my="2" >
            {objects.length === 0 ? (
                <Text>No notes to display</Text>
            ) : (
                <Heading size="4">My notes</Heading>
            )}
            {objects.map((object) => (
                <Container key={object} style={{ margin: "10px" }}><Button style={{ width: "100%" }} onClick={() => setCurrentObjectId(object)}>{object}</Button></Container>
            ))}
        </Flex>
    );
}
