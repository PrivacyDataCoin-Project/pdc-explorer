import { Dispatch } from "react";
import NetMode from "./NetMode";

interface ContextState {
    netMode: NetMode;
}

type ContextAction = {
    type: string;
};

interface ContextValue {
    state: ContextState;
    dispatch: Dispatch<ContextAction>;
}

export default ContextValue;

export type { ContextState, ContextAction };