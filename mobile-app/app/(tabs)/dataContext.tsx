import React, { createContext, useContext, useState, ReactNode } from "react";

interface DataContextType {
  receivedData: string;
  setReceivedData: React.Dispatch<React.SetStateAction<string>>;
}

const DataContext = createContext<DataContextType | undefined>(
  undefined
);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [receivedData, setReceivedData] = useState<string>("");

  return (
    <DataContext.Provider value={{ receivedData, setReceivedData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
