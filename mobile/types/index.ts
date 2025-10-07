export interface Patient {
    name: string;
    birthday: string;
    contact_number: string;
    illness_note: string;
}

export interface PatientFormData {
  patient: Patient;
  sessionId: string;
  status: "pending" | "accepted" | "rejected" | "serving" | "served" | "skipped";
  device_token: string;
  device_id: string;
  created_at: Date;
  updated_at: Date;
};

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