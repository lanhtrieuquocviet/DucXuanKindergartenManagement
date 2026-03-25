import React, { createContext, useContext } from "react";

const SchoolNurseContext = createContext();

export function SchoolNurseProvider({ children }) {
  return <SchoolNurseContext.Provider value={{}}>{children}</SchoolNurseContext.Provider>;
}

export function useSchoolNurse() {
  const context = useContext(SchoolNurseContext);
  if (!context) {
    throw new Error("useSchoolNurse must be used within SchoolNurseProvider");
  }
  return context;
}
