"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const BranchContext = createContext();

export function BranchProvider({ children, initialBranch = "all" }) {
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedBranch = localStorage.getItem("selected_branch");
    if (savedBranch) {
      setSelectedBranch(savedBranch);
    }
  }, []);

  const changeBranch = (branchId) => {
    setSelectedBranch(branchId);
    localStorage.setItem("selected_branch", branchId);
  };

  return (
    <BranchContext.Provider value={{ selectedBranch, changeBranch, isMounted }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
