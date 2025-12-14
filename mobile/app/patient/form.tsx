import { MediQImages } from "@/constants/theme";
import { useUser } from "@/contexts/userContext";
import { PatientFormData } from "@/types";
import { getExpoPushToken } from "@/utils/getExpoPushToken";
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

export default function PatientFormScreen() {
  const router = useRouter();

  const [doctors, setDoctors] = useState<
    { id: string; first_name: string; specialization: string;[key: string]: any }[]
  >([]);
  const [sessions, setSessions] = useState<
    { id: string;[key: string]: any }[]
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
  const { userState, setUserData, setPatientStatus, setUserRole } = useUser();
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [showSpecializations, setShowSpecializations] = useState(false);

  const [selectedGender, setSelectedGender] = useState<"Male" | "Female" | "">("");

  const handleSpecializationSelect = (specialization: string) => {
    setSelectedSpecialization(specialization);
    setSelectedDoctor(null); // Reset doctor selection when specialization changes
    setShowSpecializations(false);
    setShowDoctors(false);
  };

  const fetchDoctors = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "doctors"));
      const doctorsList: { id: string; first_name: string; specialization: string;[key: string]: any }[] = [];
      const specializationSet = new Set<string>();
      querySnapshot.forEach((doc) => {
        const doctorData = { id: doc.id, ...doc.data() } as { id: string; first_name: string; specialization: string;[key: string]: any };
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
      const sessionsList: { id: string;[key: string]: any }[] = [];
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
    const filteredSessions = sessions.filter(
      (session) =>
        session.doctor_id === selectedDoctor.uid
    );
    return filteredSessions;
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
      // Add haptic feedback at the start
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Validate required fields
      if (!firstName || !lastName || !selectedDoctor || !selectedSession) {
        // Error haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        session_id: selectedSession.id,
        status: "pending",
        device_token: (await getExpoPushToken()) || "",
        device_id: userState.deviceId || "",
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Add document to 'tokens' collection, if fail, jump to catch block
      const docRef = await addDoc(collection(db, "tokens"), patientData);

      setUserData({ tokenId: docRef.id });
      await setPatientStatus("pending");
      router.replace({
        pathname: "/patient/status/pending", params: {
          tokenId: docRef.id
        }
      });

      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
      // Error haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
            onPress={() => { router.back(); setUserRole(null) }}
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
            className={`border border-gray-200 rounded-xl p-4 flex-row items-center justify-between ${selectedSpecialization
              ? 'bg-gray-50 active:bg-gray-100'
              : 'bg-gray-100'
              }`}
            disabled={!selectedSpecialization}
          >
            <View className="flex-1">
              <Text className={`text-base ${selectedDoctor
                ? 'text-mediq-blue font-medium'
                : selectedSpecialization
                  ? 'text-gray-400'
                  : 'text-gray-300'
                }`}>
                {selectedDoctor ? `Dr. ${selectedDoctor.first_name}` : "Select Doctor"}
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
                      <Text className={`text-base font-medium ${selectedDoctor?.id === doctor.id ? 'text-blue-600' : 'text-gray-800'
                        }`}>Dr. {doctor.first_name}</Text>
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

          <View className="mt-6">
            <Text className="text-lg font-medium text-mediq-text-black mb-3">
              First Name
            </Text>
            <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center mb-4">
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-base text-mediq-blue font-medium"
              />
            </View>
            <Text className="text-lg font-medium text-mediq-text-black mb-3">
              Last Name
            </Text>
            <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-base text-mediq-blue font-medium"
              />
            </View>
          </View>

          <View className="mt-6">
            <Text className="text-lg font-medium text-mediq-text-black mb-3">
              Gender
            </Text>
            <View className="flex-row justify-center items-center">
              <Pressable
                onPress={() => setSelectedGender("Male")}
                className={`w-40 h-14 rounded-xl items-center justify-center mr-5 ${selectedGender === "Male"
                  ? 'border border-black'
                  : 'bg-gray-50 border border-gray-200'
                  }`}>
                <Text className={`text-base ${selectedGender === "Male" ? 'text-mediq-blue font-medium' : 'text-gray-600 font-medium'
                  }`}>
                  Male
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedGender("Female")}
                className={`w-40 h-14 rounded-xl items-center justify-center ml-5 ${selectedGender === "Female"
                  ? 'border border-black'
                  : 'bg-gray-50 border border-gray-200'
                  }`}>
                <Text className={`text-base ${selectedGender === "Female" ? 'text-mediq-blue font-medium' : 'text-gray-600 font-medium'
                  }`}>
                  Female
                </Text>
              </Pressable>
            </View>

            <View className="mt-6">
              <Text className="text-lg font-medium text-mediq-text-black mb-3">
                Date of Birth
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <TextInput
                  value={birthday}
                  onChangeText={setBirthday}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-base text-mediq-blue font-medium"
                />
              </View>
            </View>
            <View className="mt-6">
              <Text className="text-lg font-medium text-mediq-text-black mb-3">
                Contact No
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center">
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <TextInput
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  placeholder="+94 567 7689"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-base text-mediq-blue font-medium"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View className="mt-6">
              <Text className="text-lg font-medium text-mediq-text-black mb-1">
                Type of Illness
              </Text>
              <Text className="text-sm text-gray-500 mb-3">(Optional)</Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px]">
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="I haven't been eating well lately, and I don't know why. My right foot also hurts so much, please help me, doc A!"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-base text-gray-800"
                  multiline
                  textAlignVertical="top"
                />
                <Text className="text-right text-sm text-gray-400 mt-2">
                  {note.length}/250
                </Text>
              </View>
            </View>

            {selectedDoctor && (
              <View className="mt-6">
                <Text className="text-lg font-medium text-mediq-text-black mb-3">
                  Available Time
                </Text>
                <Pressable
                  onPress={() => setShowSessions(!showSessions)}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between active:bg-gray-100"
                >
                  <Text className={`text-base ${selectedSession ? 'text-mediq-blue font-medium' : 'text-gray-400'}`}>
                    {selectedSession ? formatSessionTime(selectedSession) : "Choose available time"}
                  </Text>
                  <Ionicons
                    name={showSessions ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>

                {showSessions && (
                  <View className="bg-white border border-gray-200 rounded-xl mt-2 max-h-48">
                    <ScrollView showsVerticalScrollIndicator={true}>
                      {getAvailableSessionsForDoctor().length > 0 ? (
                        getAvailableSessionsForDoctor().map((session, index) => (
                          <Pressable
                            key={session.id}
                            onPress={() => {
                              setSelectedSession(session);
                              setShowSessions(false);
                            }}
                            className={`p-4 ${index !== getAvailableSessionsForDoctor().length - 1 ? 'border-b border-gray-100' : ''} 
                           ${selectedSession?.id === session.id ? 'bg-blue-50 rounded-xl' : ''} active:bg-gray-50`}
                          >
                            <Text className={`text-base ${selectedSession?.id === session.id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                              {formatSessionTime(session)}
                            </Text>
                          </Pressable>
                        ))
                      ) : (
                        <View className="p-4">
                          <Text className="text-gray-500 text-center">
                            No available sessions for this doctor
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

          </View>
        </ScrollView>
        <View className="px-6 pb-6 ">
          <Pressable
            onPress={handleSubmit}
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
