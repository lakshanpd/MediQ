import { useUser } from "@/contexts/userContext";
import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";

export default function PatientRejectedScreen() {
  const { resetUser } = useUser();
  const handleRejected = async () => {
    await resetUser();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your appointment was rejected</Text>

      <TouchableOpacity style={styles.rejectedButton} onPress={handleRejected}>
        <Text style={styles.rejectedButtonText}>Reset All</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 20, textAlign: "center" },
  rejectedButton: {
    backgroundColor: "#ff3b30",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  rejectedButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});