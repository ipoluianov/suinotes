export interface DError {
    errorMessage: string;
}

function makeError (errorMessage: string): DError {
    return { errorMessage };
}

export { makeError };
