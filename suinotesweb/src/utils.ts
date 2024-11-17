function shortAddress(address: string | null): string {
    if (address == null) {
        return "";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export { shortAddress };
