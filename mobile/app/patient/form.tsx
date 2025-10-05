import { Text, View, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useState, useEffect } from "react";

export default function PatientFormScreen() {
  const [doctors, setDoctors] = useState<Array<{ id: string; [key: string]: any }>>([]);
  const [sessions, setSessions] = useState<Array<{ id: string; [key: string]: any }>>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showDoctors, setShowDoctors] = useState(false);

  const fetchDoctors = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'doctors'));
      const doctorsList: Array<{ id: string; [key: string]: any }> = [];
      querySnapshot.forEach((doc) => {
        doctorsList.push({ id: doc.id, ...doc.data() });
      });
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors: ', error);
    }
  };

  const fetchAvailableSessions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'sessions'));
      const sessionsList: Array<{ id: string; [key: string]: any }> = [];
      querySnapshot.forEach((doc) => {
        sessionsList.push({ id: doc.id, ...doc.data() });
      });
      setSessions(sessionsList);
    } catch (error) {
      console.error('Error fetching available sessions: ', error);
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
          />
        </View>
        
        {/* Last Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
          />
        </View>
        
        {/* Birthday */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Birthday</Text>
          <TextInput
            style={styles.input}
            placeholder="MM/DD/YYYY"
          />
        </View>
        
        {/* Contact Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Doctor Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Doctor</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowDoctors(!showDoctors)}
          >
            <Text>{selectedDoctor ? selectedDoctor.name : "Choose a doctor"}</Text>
          </TouchableOpacity>
          
          {showDoctors && (
            <View>
              {doctors.map((doctor) => (
                <TouchableOpacity 
                  key={doctor.id}
                  onPress={() => {
                    setSelectedDoctor(doctor);
                    setShowDoctors(false);
                  }}
                >
                  <Text style={{ padding: 10, backgroundColor: '#f0f0f0', margin: 2 }}>
                    {doctor.first_name + " " + doctor.last_name} - {doctor.specialization}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Note */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Additional notes or comments"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  noteInput: {
    height: 100,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});