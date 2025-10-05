import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useState, useEffect } from "react";
import { getExpoPushToken } from "@/utils/getExpoPushToken";

export default function PatientFormScreen() {
  const [doctors, setDoctors] = useState<
    Array<{ id: string; [key: string]: any }>
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

  const fetchDoctors = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "doctors"));
      const doctorsList: Array<{ id: string; [key: string]: any }> = [];
      querySnapshot.forEach((doc) => {
        doctorsList.push({ id: doc.id, ...doc.data() });
      });
      setDoctors(doctorsList);
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
      const patientData = {
        patient: {
          name: firstName + " " + lastName,
          birthday,
          contact_number: contactNumber,
          illness_note: note,
        },
        sessionId: selectedSession.id,
        status: "pending",
        device_token: await getExpoPushToken(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add document to 'tokens' collection
      const docRef = await addDoc(collection(db, "tokens"), patientData);
      console.log("Document written with ID: ", docRef.id);

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
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Patient Registration Form</Text>

        {/* First Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        {/* Birthday */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Birthday</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={birthday}
            onChangeText={setBirthday}
          />
        </View>

        {/* Contact Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={setContactNumber}
          />
        </View>

        {/* Doctor Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Doctor</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDoctors(!showDoctors)}
          >
            <Text>
              {selectedDoctor
                ? selectedDoctor.first_name + " " + selectedDoctor.last_name
                : "Choose a doctor"}
            </Text>
          </TouchableOpacity>

          {showDoctors && (
            <View>
              {doctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  onPress={() => {
                    setSelectedDoctor(doctor);
                    setSelectedSession(null); // Reset session when doctor changes
                    setShowDoctors(false);
                  }}
                >
                  <Text
                    style={{
                      padding: 10,
                      backgroundColor: "#f0f0f0",
                      margin: 2,
                    }}
                  >
                    {doctor.first_name + " " + doctor.last_name} -{" "}
                    {doctor.specialization}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Session Selection - Only show if doctor is selected */}
        {selectedDoctor && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Available Time</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowSessions(!showSessions)}
            >
              <Text>
                {selectedSession
                  ? formatSessionTime(selectedSession)
                  : "Choose available time"}
              </Text>
            </TouchableOpacity>

            {showSessions && (
              <View>
                {getAvailableSessionsForDoctor().map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    onPress={() => {
                      setSelectedSession(session);
                      setShowSessions(false);
                    }}
                  >
                    <Text
                      style={{
                        padding: 10,
                        backgroundColor: "#e8f4fd",
                        margin: 2,
                      }}
                    >
                      {formatSessionTime(session)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        {/* Note */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Additional notes or comments"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
