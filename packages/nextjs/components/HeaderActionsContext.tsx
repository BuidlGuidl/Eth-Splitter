"use client";

import { ReactNode, createContext, useContext, useState } from "react";

interface HeaderActionsContextType {
  customActions: ReactNode;
  setCustomActions: (actions: ReactNode) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType | undefined>(undefined);

export const HeaderActionsProvider = ({ children }: { children: ReactNode }) => {
  const [customActions, setCustomActions] = useState<ReactNode>(null);

  return (
    <HeaderActionsContext.Provider value={{ customActions, setCustomActions }}>
      {children}
    </HeaderActionsContext.Provider>
  );
};

export const useHeaderActions = () => {
  const context = useContext(HeaderActionsContext);
  if (!context) {
    throw new Error("useHeaderActions must be used within HeaderActionsProvider");
  }
  return context;
};
