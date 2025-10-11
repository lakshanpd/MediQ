import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useUser } from "@/contexts/userContext";
import { useDoctor } from "@/contexts/doctorContext";

export default function SettingsScreen() {
  const { resetUser } = useUser();
  const { doctorMetaData } = useDoctor();

  const handleLogout = async () => {
    try {
      // Sign out from Firebase (if auth is configured)
      if (auth && typeof signOut === "function") {
        await signOut(auth);
      }

      // Reset local user state
      await resetUser();

      // Optional: show confirmation
      Alert.alert("Logged out", "You have been signed out.");
    } catch (err) {
      console.error("Logout error", err);
      const error: any = err;
      Alert.alert("Logout failed", error?.message || String(error));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Doctor Settings</Text>

      {/* doctor metadata for testing */}
      <View style={{ marginTop: 16, alignItems: "center" }}>
        <Text style={{ fontWeight: "600" }}>Doctor Info</Text>
        <Text>{doctorMetaData ? `${doctorMetaData.first_name} ${doctorMetaData.last_name}` : "(not loaded)"}</Text>
        <Text>{doctorMetaData ? `id: ${doctorMetaData.id}` : ""}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  text: { fontSize: 18, fontWeight: "600", marginBottom: 20 },
  button: { marginTop: 12, backgroundColor: "#ff3b30", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});