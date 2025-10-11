import React, { createContext, useContext, ReactNode } from "react";
import { Doctor, Session } from "@/types";
import { DocumentData } from "firebase/firestore";

export type DoctorContextType = {
  doctorMetaData: (Doctor & { id: string }) | null;
  doctorSessions: Array<Session & { id: string }> | null;
  doctorTokens: Array<{ id: string } & DocumentData> | null;
  fetchDoctorMetaData?: (uid: string | null) => Promise<void>;
  fetchDoctorSessions?: (doctorId?: string | null) => Promise<void>;
};

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export function useDoctor() {
  const ctx = useContext(DoctorContext);
  if (!ctx) throw new Error("useDoctor must be used inside DoctorProvider");
  return ctx;
}

export function DoctorProvider({ children, value }: { children: ReactNode; value: DoctorContextType }) {
  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
}

export default DoctorProvider;
