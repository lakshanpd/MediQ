import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useUser } from "@/contexts/userContext";
import { useDoctor } from "@/contexts/doctorContext";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
      {/* Profile card */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {doctorMetaData
              ? `${(doctorMetaData.first_name?.[0] ?? "").toUpperCase()}${(doctorMetaData.last_name?.[0] ?? "").toUpperCase()}`
              : "DR"}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>
            {doctorMetaData ? `${doctorMetaData.first_name} ${doctorMetaData.last_name}` : "(not loaded)"}
          </Text>
          <Text style={styles.specializationText}>{doctorMetaData?.specialization ?? "(no specialization)"}</Text>
          <Text style={styles.idText}>{doctorMetaData ? `ID: ${doctorMetaData.id}` : ""}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "flex-start", backgroundColor: "#f6f8fb", padding: 16 },
  text: { fontSize: 18, fontWeight: "600", marginBottom: 20 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#dfe7ff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#2a4fff" },
  infoContainer: { flex: 1 },
  nameText: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  specializationText: { fontSize: 14, color: "#666", marginBottom: 6 },
  idText: { fontSize: 12, color: "#999" },
  logoutButton: { marginTop: 24, backgroundColor: "#ff3b30", paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
  logoutButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});