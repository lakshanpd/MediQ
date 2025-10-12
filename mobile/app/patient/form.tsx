import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Pressable,
  Platform,
  Image,
  Alert
} from "react-native";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useState, useEffect, use } from "react";
import { getExpoPushToken } from "@/utils/getExpoPushToken";
import { PatientFormData } from "@/types";
import { useUser } from "@/contexts/userContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { MediQImages } from "@/constants/theme";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from "expo-router";

export default function PatientFormScreen() {
  const router = useRouter();

  const [doctors, setDoctors] = useState<
    Array<{ id: string; first_name: string; specialization: string; [key: string]: any }>
  >([]);
  const [sessions, setSessions] = useState<
    Array<{ id: string; [key: string]: any }>
  >([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showDoctors, setShowDoctors] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [note, setNote] = useState("");
  const { userState, setUserData, setPatientStatus } = useUser();
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [showSpecializations, setShowSpecializations] = useState(false);

    const handleSpecializationSelect = (specialization: string) => {
    setSelectedSpecialization(specialization);
    setSelectedDoctor(null); // Reset doctor selection when specialization changes
    setShowSpecializations(false);
    setShowDoctors(false);
  };

  const fetchDoctors = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "doctors"));
      const doctorsList: Array<{ id: string; first_name: string; specialization: string; [key: string]: any }> = [];
      const specializationSet = new Set<string>();
      querySnapshot.forEach((doc) => {
        const doctorData = { id: doc.id, ...doc.data() } as { id: string; first_name: string; specialization: string; [key: string]: any };
        doctorsList.push(doctorData);
        specializationSet.add(doctorData.specialization);
      });
      setDoctors(doctorsList);
      setSpecializations(Array.from(specializationSet).sort());
    } catch (error) {
      console.error("Error fetching doctors: ", error);
    }
  };

  const fetchAvailableSessions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "sessions"));
      const sessionsList: Array<{ id: string; [key: string]: any }> = [];
      querySnapshot.forEach((doc) => {
        sessionsList.push({ id: doc.id, ...doc.data() });
      });
      setSessions(sessionsList);
    } catch (error) {
      console.error("Error fetching available sessions: ", error);
    }
  };

  const getFilteredDoctors = () => {
    if (!selectedSpecialization) return [];
    return doctors.filter(doctor => doctor.specialization === selectedSpecialization);
  };

    const handleDoctorSelect = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowDoctors(false);
  };

  const isSessionWithin12Hours = (session: any) => {
    const now = new Date();
    const sessionStartTime = new Date(session.start_time);
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    // Check if session is in the future and within 12 hours
    return sessionStartTime >= now && sessionStartTime <= twelveHoursFromNow;
  };

  const getAvailableSessionsForDoctor = () => {
    if (!selectedDoctor) return [];
    return sessions.filter(
      (session) =>
        session.doctor_id === selectedDoctor.id &&
        isSessionWithin12Hours(session)
    );
  };

  const formatSessionTime = (session: any) => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const now = new Date();

    // Check if it's today or tomorrow
    const isToday = startTime.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = startTime.toDateString() === tomorrow.toDateString();

    // Format time in 12-hour format
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const dayLabel = isToday
      ? "Today"
      : isTomorrow
      ? "Tomorrow"
      : startTime.toLocaleDateString();
    const startTimeFormatted = formatTime(startTime);
    const endTimeFormatted = formatTime(endTime);

    return `${dayLabel}, ${startTimeFormatted} – ${endTimeFormatted}`;
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!firstName || !lastName || !selectedDoctor || !selectedSession) {
        alert("Please fill in all required fields");
        return;
      }


      // Create patient data object
      const patientData: PatientFormData = {
        patient: {
          name: firstName + " " + lastName,
          birthday,
          contact_number: contactNumber,
          illness_note: note,
        },
        sessionId: selectedSession.id,
        status: "pending",
        device_token: await getExpoPushToken() || "",
        device_id: userState.deviceId || "",
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Add document to 'tokens' collection
      const docRef = await addDoc(collection(db, "tokens"), patientData);
      setUserData({tokenId: docRef.id});
      setPatientStatus("pending");

      // Reset form after successful submission
      setFirstName("");
      setLastName("");
      setBirthday("");
      setContactNumber("");
      setNote("");
      setSelectedDoctor(null);
      setSelectedSession(null);

      alert("Registration submitted successfully!");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error submitting registration. Please try again.");
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchAvailableSessions();
  }, []);

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <SafeAreaView className="flex-1">
        {/* Top-level container so absolute-positioned BackButton overlays content */}
        <View className="flex-row justify-start items-center absolute top-24 left-8">
          {/* Absolute Back Button (pinned top-left) */}

          <Pressable
            onPress={() => router.replace("/")}
            className="w-16 h-16 rounded-2xl border border-slate-400 p-4 active:scale-95" // z-50 keeps it above other elements
          >
            <Ionicons 
                  name={"chevron-back"} 
                  size={24} 
                  color="#6B7280" 
                />
          </Pressable>
          <Text className="text-2xl font-bold text-mediq-text-black ml-6">
            Select Your Doctor
          </Text>
        </View>

          <View className="items-center mb-8 mt-32">
            <Image
              source={MediQImages.doctor_avatar_standing}
              className="w-56 h-56"
              resizeMode="contain"
            />
          </View>
          <ScrollView className=" px-6">
          {/* Specialization Section */}
          <View>
            <Text className=" text-lg font-medium text-mediq-text-black mb-3">
              Specialization
            </Text>
          </View>
         <Pressable
                onPress={() => setShowSpecializations(!showSpecializations)}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between active:bg-gray-100"
              >
                <Text className={`text-base ${selectedSpecialization ? 'text-mediq-blue font-medium' : 'text-gray-400'}`}>
                  {selectedSpecialization || "Select Specialization"}
                </Text>
                <Ionicons 
                  name={showSpecializations ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6B7280" 
                />
              </Pressable>

              {showSpecializations && (
                <View className="bg-white border border-gray-200 rounded-xl mt-2 max-h-48">
                  <ScrollView showsVerticalScrollIndicator={true}>
                    {specializations.map((spec, index) => (
                      <Pressable
                        key={spec}
                        onPress={() => handleSpecializationSelect(spec)}
                        className={`p-4 ${index !== specializations.length - 1 ? 'border-b border-gray-100' : ''} 
                                   ${selectedSpecialization === spec ? 'bg-blue-50 rounded-xl' : ''} active:bg-gray-50`}
                      >
                        <Text className={`text-base ${selectedSpecialization === spec ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                          {spec}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}


          <View className="mt-6">
            <Text className="text-lg font-medium text-mediq-text-black mb-3">
              Doctor
            </Text>
          </View>
          <Pressable
                onPress={() => {
                  if (selectedSpecialization) {
                    setShowDoctors(!showDoctors);
                  } else {
                    Alert.alert("Select Specialization", "Please select a specialization first");
                  }
                }}
                className={`border border-gray-200 rounded-xl p-4 flex-row items-center justify-between ${
                  selectedSpecialization 
                    ? 'bg-gray-50 active:bg-gray-100' 
                    : 'bg-gray-100'
                }`}
                disabled={!selectedSpecialization}
              >
                <View className="flex-1">
                  <Text className={`text-base ${
                    selectedDoctor 
                      ? 'text-mediq-blue font-medium' 
                      : selectedSpecialization 
                        ? 'text-gray-400' 
                        : 'text-gray-300'
                  }`}>
                    {selectedDoctor?.first_name || "Select Doctor"}
                  </Text>
                  {selectedDoctor && (
                    <Text className="text-sm text-gray-500 mt-1">
                      {selectedDoctor.specialization}
                    </Text>
                  )}
                </View>
                <Ionicons 
                  name={showDoctors ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={selectedSpecialization ? "#6B7280" : "#D1D5DB"} 
                />
              </Pressable>

              {showDoctors && selectedSpecialization && (
                <View className="bg-white border border-gray-200 rounded-xl mt-2 max-h-48">
                  <ScrollView showsVerticalScrollIndicator={true}>
                     {getFilteredDoctors().length > 0 ? (
                      getFilteredDoctors().map((doctor, index) => (
                        <Pressable
                          key={doctor.id}
                          onPress={() => handleDoctorSelect(doctor)}
                          className={`p-4 ${index !== getFilteredDoctors().length - 1 ? 'border-b border-gray-100' : ''} 
                                     ${selectedDoctor?.id === doctor.id ? 'bg-blue-50 rounded-xl' : ''} active:bg-gray-50`}
                        >
                          <Text className={`text-base font-medium ${
                            selectedDoctor?.id === doctor.id ? 'text-blue-600' : 'text-gray-800'
                          }`}>
                            {doctor.first_name}
                          </Text>
                          <Text className="text-sm text-gray-500 mt-1">
                            {doctor.specialization}
                          </Text>
                        </Pressable>
                      ))
                    ) : (
                      <View className="p-4">
                        <Text className="text-gray-500 text-center">
                          No doctors found for {selectedSpecialization}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

          </ScrollView>
<View className="px-6 pb-6 ">
          <Pressable
            onPress={() => console.log("Continue pressed")}
            className="h-16 rounded-2xl bg-mediq-blue p-4 flex-row items-center justify-center active:scale-95">
            <Text className="text-xl text-white font-bold">
              Continue
            </Text>
      
          </Pressable>
        </View>
        
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  noteInput: {
    height: 100,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
