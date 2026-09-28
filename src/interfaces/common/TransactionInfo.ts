interface Input {
    amount: number;
    keyimage: string;
    mixins: any[];
    globalIndexes: number[];
}

interface Output {
    amount: number | string;
    publicKeys: string[];
    globalIndex: string;
}

interface TransactionInfo {
    hash: string;
    amount: string;
    fee: string;
    size: string;
    confirmations: number;
    publicKey: string;
    mixin?: string;
    extraItems: string[];
    attachments?: string;
    ins: Input[];
    outs: Output[];
}

export default TransactionInfo;

export type { Input, Output };