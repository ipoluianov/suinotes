import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { useState } from "react";
import { Counter } from "./Counter";
import { CreateCounter } from "./CreateCounter";
import { Notes } from "./Notes";
import { Fund } from "./Fund";

function App() {
	const currentAccount = useCurrentAccount();
	const [counterId, setCounter] = useState(() => {
		const hash = window.location.hash.slice(1);
		return isValidSuiObjectId(hash) ? hash : null;
	});

	return (
		<>
			<Flex
				position="sticky"
				px="4"
				py="2"
				justify="between"
				style={{
					borderBottom: "1px solid var(--gray-a2)",
				}}
			>
				<Box>
					<Heading><a href="/">SUI Notes</a></Heading>
				</Box>

				<Box>
					<ConnectButton />
				</Box>
			</Flex>
			<Container>
				<Container
					mt="5"
					pt="2"
					px="4"
					style={{ background: "var(--gray-a2)", minHeight: 500 }}
				>
					<Container>
						<Counter id={counterId} visible={counterId != null} onBack={() => {
							window.location.hash = "";
							setCounter(null);
						}} />
					</Container>
					<Container>
						<CreateCounter
							onCreated={(id) => {
								window.location.hash = id;
								setCounter(id);
							}}
							visible={counterId == null}
						/>
						<Notes onSelected={(id) => {
							window.location.hash = id;
							setCounter(id);

						}}
							visible={counterId == null}
						/>
						<CreateCounter
							onCreated={(id) => {
								window.location.hash = id;
								setCounter(id);
							}}
							visible={counterId == null}
						/>
						<Fund />
					</Container>
					{currentAccount ? (
						<Heading></Heading>
					) : (
						<Heading>Please connect your wallet</Heading>
					)
					}
				</Container>
			</Container>
		</>
	);
}

export default App;
