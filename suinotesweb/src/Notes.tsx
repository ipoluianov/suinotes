import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useSignPersonalMessage } from "@mysten/dapp-kit";

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
    const { mutate: signPersonalMessage } = useSignPersonalMessage();

    const account = useCurrentAccount();
    const { data, isPending, error } = useSuiClientQuery(
        "getOwnedObjects",
        {
            owner: account?.address as string,
            options: {
                showType: true,
            },
        },
        {
            enabled: !!account,
        },
    );

    if (!account) {
        return;
    }

    if (error) {
        return <Flex>Error: {error.message}</Flex>;
    }

    if (isPending || !data) {
        return <Flex>Loading...</Flex>;
    }

    let objects = [];
    for (let i = 0; i < data.data.length; i++) {
        if (data.data[i].data?.type?.indexOf(counterPackageId) === 0) {
            objects.push(data.data[i].data);
        }
    }

    const setCurrentObjectId = (objectId: string | undefined) => {
        if (objectId === undefined) {
            return;
        }
        onSelected(objectId);
    }


    return (
        <Flex direction="column" my="2" >
            {data.data.length === 0 ? (
                <Text>No notes to display</Text>
            ) : (
                <Heading size="4">My notes</Heading>
            )}
            {objects.map((object) => (
                <Container key={object?.objectId} style={{ margin: "10px" }}><Button style={{ width: "100%" }} onClick={() => setCurrentObjectId(object?.objectId)}>{object?.objectId}</Button></Container>
            ))}
        </Flex>
    );
}
