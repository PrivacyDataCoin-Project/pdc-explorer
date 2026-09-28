import { ReactNode, createContext, useReducer } from "react";
import ContextValue, { ContextAction, ContextState } from "@/interfaces/common/ContextValue";

const initialState: ContextState = {
  netMode: "MAIN",
};

const reducer = (state: ContextState, action: ContextAction): ContextState => {
  switch (action.type) {
    default:
      return { ...state };
  }
};

export const Store = createContext<ContextValue>({ state: initialState, dispatch: () => null });
export const StoreProvider = ({
  initial,
  children
}: {
  initial: ContextState;
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <Store.Provider value={{ state, dispatch }}>
      {children}
    </Store.Provider>
  );
};
