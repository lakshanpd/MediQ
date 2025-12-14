export interface Patient {
  name: string;
  birthday: string;
  contact_number: string;
  illness_note: string;
}

export interface PatientFormData {
  patient: Patient;
  session_id: string;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "serving"
    | "served"
    | "skipped";
  device_token: string;
  device_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Doctor {
  doctorId: string;
  first_name: string;
  last_name: string;
  specialization: string;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  sessionId: string;
  doctor_id: string;
  start_time: Date; // UTC timestamp
  end_time: Date; // UTC timestamp
  status: "scheduled" | "active" | "ended" | "cancelled";
  created_at: Date;
  updated_at: Date;
}

export type UserRole = "patient" | "doctor";

export type PatientStatus = "form" | "pending" | "accepted" | "rejected";

export type DoctorStatus =
  | "inactive"
  | "active"
  | "in_session"
  | "break"
  | "offline";

export interface UserState {
  role: UserRole | null;
  patientStatus: PatientStatus | null;
  doctorStatus: DoctorStatus | null;
  userId: string | null;
  deviceId: string | null;
  userData: any;
}

// context types
export interface UserContextType {
  // State
  userState: UserState;

  // Actions
  setUserRole: (role: UserRole | null) => Promise<void>;
  setPatientStatus: (status: PatientStatus) => Promise<void>;
  setDoctorStatus: (status: DoctorStatus) => Promise<void>;
  setUserId: (id: string) => Promise<void>;
  setDeviceId: (token: string) => Promise<void>;
  resetUser: () => Promise<void>;
  setUserData: (data: any) => void;
}
