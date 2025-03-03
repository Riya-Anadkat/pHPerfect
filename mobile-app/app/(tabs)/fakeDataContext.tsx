import React, { createContext, useContext, useState, ReactNode } from "react";

interface FakeDataContextType {
  fakeReceivedData: string;
  setFakeReceivedData: React.Dispatch<React.SetStateAction<string>>;
}

const FakeDataContext = createContext<FakeDataContextType | undefined>(
  undefined
);

export const FakeDataProvider = ({ children }: { children: ReactNode }) => {
  const [fakeReceivedData, setFakeReceivedData] = useState<string>("");

  return (
    <FakeDataContext.Provider value={{ fakeReceivedData, setFakeReceivedData }}>
      {children}
    </FakeDataContext.Provider>
  );
};

export const useFakeData = () => {
  const context = useContext(FakeDataContext);
  if (!context) {
    throw new Error("useFakeData must be used within a FakeDataProvider");
  }
  return context;
};
