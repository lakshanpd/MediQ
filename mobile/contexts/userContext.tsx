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
import { generateUniqueId } from "@/utils/generateDeviceId";

// Storage keys
const STORAGE_KEYS = {
  USER_ROLE: "mediq_user_role",
  PATIENT_STATUS: "mediq_patient_status",
  DOCTOR_STATUS: "mediq_doctor_status",
  USER_ID: "mediq_user_id",
  DEVICE_ID: "mediq_device_id",
  USER_DATA: "mediq_user_data",
};

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Initial state
const initialState: UserState = {
  role: null,
  patientStatus: null,
  doctorStatus: null,
  userId: null,
  deviceId: null,
  userData: null,
};

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [userState, setUserState] = useState<UserState>(initialState);

  // Load user data from storage on app start
  const loadUserFromStorage = async () => {
    try {
      let [
        storedRole,
        storedPatientStatus,
        storedDoctorStatus,
        storedUserId,
        storedDeviceId,
        storedUserData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE),
        AsyncStorage.getItem(STORAGE_KEYS.PATIENT_STATUS),
        AsyncStorage.getItem(STORAGE_KEYS.DOCTOR_STATUS),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (!storedDeviceId) {
        storedDeviceId = generateUniqueId();
      }

      setUserState({
        role: storedRole as UserRole | null,
        patientStatus: storedPatientStatus as PatientStatus | null,
        doctorStatus: storedDoctorStatus as DoctorStatus | null,
        userId: storedUserId,
        deviceId: storedDeviceId,
        userData: storedUserData ? JSON.parse(storedUserData) : null,
      });
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      setUserState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Set user role
  const setUserRole = async (role: UserRole | null) => {
    try {
      if (!role) {
        resetUser();
        return;
      }
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

  // Set device ID
  const setDeviceId = async (id: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
      setUserState((prev) => ({ ...prev, deviceId: id }));
    } catch (error) {
      console.error("❌ Error setting device ID:", error);
    }
  };

  // Set user data
  const setUserData = (data: any) => {
    try {
      AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
      setUserState((prev) => ({ ...prev, userData: data }));
    } catch (error) {
      console.error("❌ Error setting user data:", error);
    }
  };

  // Reset user (logout)
  const resetUser = async () => {
    try {
      // Clear all storage except device ID
      const keysToRemove = Object.values(STORAGE_KEYS).filter(
        (k) => k !== STORAGE_KEYS.DEVICE_ID
      );
      await AsyncStorage.multiRemove(keysToRemove);

      // Preserve deviceId in memory
      setUserState((prev) => ({
        ...initialState,
        deviceId: prev.deviceId ?? null,
      }));
    } catch (error) {
      console.error("❌ Error resetting user:", error);
    }
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
    setDeviceId,
    setUserData,
    resetUser,
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
