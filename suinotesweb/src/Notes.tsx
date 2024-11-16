import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Flex, Heading, Text } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";

export function Notes({
    onSelected,
  }: {
    onSelected: (id: string) => void;
  }) {
    const counterPackageId = useNetworkVariable("counterPackageId");

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
        <Flex direction="column" my="2">
            {data.data.length === 0 ? (
                <Text>No objects owned by the connected wallet</Text>
            ) : (
                <Heading size="4">Objects owned by the connected wallet</Heading>
            )}

            <h1>Objects</h1>
            {objects.map((object) => (
                <div><button onClick={() => setCurrentObjectId(object?.objectId)}>{object?.objectId}</button></div>
            ))}
            <h1>asdas</h1>
            {data.data.map((object) => (
                <Flex key={object.data?.objectId}>
                    <Text>Object ID: {object.data?.objectId} {object.data?.type}</Text>
                </Flex>
            ))}
        </Flex>
    );
}
