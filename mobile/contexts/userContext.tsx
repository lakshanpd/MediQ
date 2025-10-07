import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DoctorStatus,
  PatientStatus,
  UserContextType,
  UserRole,
  UserState,
} from "@/types";

// Storage keys
const STORAGE_KEYS = {
  USER_ROLE: "mediq_user_role",
  PATIENT_STATUS: "mediq_patient_status",
  DOCTOR_STATUS: "mediq_doctor_status",
  USER_ID: "mediq_user_id",
  DEVICE_TOKEN: "mediq_device_token",
};

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Initial state
const initialState: UserState = {
  role: null,
  patientStatus: null,
  doctorStatus: null,
  userId: null,
  deviceToken: null,
};

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [userState, setUserState] = useState<UserState>(initialState);

  // Load user data from storage on app start
  const loadUserFromStorage = async () => {
    try {
      console.log("🔄 Loading user data from storage...");

      const [
        storedRole,
        storedPatientStatus,
        storedDoctorStatus,
        storedUserId,
        storedDeviceToken,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE),
        AsyncStorage.getItem(STORAGE_KEYS.PATIENT_STATUS),
        AsyncStorage.getItem(STORAGE_KEYS.DOCTOR_STATUS),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN),
      ]);

      setUserState({
        role: storedRole as UserRole | null,
        patientStatus: storedPatientStatus as PatientStatus | null,
        doctorStatus: storedDoctorStatus as DoctorStatus | null,
        userId: storedUserId,
        deviceToken: storedDeviceToken,
      });

      console.log("✅ User data loaded:", {
        role: storedRole,
        patientStatus: storedPatientStatus,
        doctorStatus: storedDoctorStatus,
      });
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      setUserState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Set user role
  const setUserRole = async (role: UserRole) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
      setUserState((prev) => ({
        ...prev,
        role,
        // Reset statuses when role changes
        patientStatus: role === "patient" ? "form" : null,
        doctorStatus: role === "doctor" ? "inactive" : null,
      }));

      // Set default status based on role
      if (role === "patient") {
        await setPatientStatus("form");
      } else if (role === "doctor") {
        await setDoctorStatus("inactive");
      }
    } catch (error) {
      console.error("❌ Error setting user role:", error);
    }
  };

  // Set patient status
  const setPatientStatus = async (status: PatientStatus) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PATIENT_STATUS, status);
      setUserState((prev) => ({ ...prev, patientStatus: status }));
    } catch (error) {
      console.error("❌ Error setting patient status:", error);
    }
  };

  // Set doctor status
  const setDoctorStatus = async (status: DoctorStatus) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DOCTOR_STATUS, status);
      setUserState((prev) => ({ ...prev, doctorStatus: status }));
    } catch (error) {
      console.error("❌ Error setting doctor status:", error);
    }
  };

  // Set user ID
  const setUserId = async (id: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, id);
      setUserState((prev) => ({ ...prev, userId: id }));
    } catch (error) {
      console.error("❌ Error setting user ID:", error);
    }
  };

  // Set device token
  const setDeviceToken = async (token: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, token);
      setUserState((prev) => ({ ...prev, deviceToken: token }));
    } catch (error) {
      console.error("❌ Error setting device token:", error);
    }
  };

  // Reset user (logout)
  const resetUser = async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      setUserState({
        ...initialState,
      });
    } catch (error) {
      console.error("❌ Error resetting user:", error);
    }
  };

  // Get current route based on user state
  const getCurrentRoute = (): string => {
    if (!userState.role) {
      return "/";
    }

    if (userState.role === "patient") {
      switch (userState.patientStatus) {
        case "form":
          return "/patient/form";
        case "pending":
          return "/patient/status/pending";
        case "accepted":
          return "/patient/status/accepted";
        case "rejected":
          return "/patient/status/rejected";
        default:
          return "/patient/form";
      }
    }

    if (userState.role === "doctor") {
      switch (userState.doctorStatus) {
      }
    }

    return "/role-selection";
  };

  // Computed values
  const isPatient = userState.role === "patient";
  const isDoctor = userState.role === "doctor";

  // Load user data on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const contextValue: UserContextType = {
    userState,
    setUserRole,
    setPatientStatus,
    setDoctorStatus,
    setUserId,
    setDeviceToken,
    resetUser,
    isPatient,
    isDoctor,
    getCurrentRoute,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

// Custom hook to use the context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
