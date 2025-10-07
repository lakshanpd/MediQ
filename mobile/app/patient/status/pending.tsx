import React from "react";
import { useUser } from "@/contexts/userContext";
import { useTokenListener } from "@/hooks/useTokenListener";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { router } from "expo-router";

export default function PatientPendingScreen() {
  const { userState, setPatientStatus } = useUser();
  const tokenData = useTokenListener(userState?.userData?.tokenId ?? null);

  const handleCancel = () => {
    Alert.alert(
      "Cancel appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              // try patient id from tokenData, fallback to userState.userId
              const tokenId = userState.userData.tokenId;

              const tokenRef = doc(db, "tokens", tokenId);
              await updateDoc(tokenRef, {
                status: "cancelled",
                updated_at: serverTimestamp(),
              });

              setPatientStatus && setPatientStatus("form");

              Alert.alert("Cancelled", "Your appointment has been cancelled.");
            } catch (error) {
              console.error("Cancel appointment error:", error);
              Alert.alert(
                "Error",
                "Failed to cancel appointment. Please try again later."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!tokenData) return null;
  if (tokenData.status === "accepted") {
    setPatientStatus && setPatientStatus("accepted");
    return null;
  }

  if (tokenData.status === "pending") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Request submitted</Text>

        <Text style={styles.info}>
          We are reviewing your appointment request. You will be notified when
          it is accepted.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{tokenData?.patient?.name ?? "none"}</Text>

          <Text style={styles.label}>Birthday</Text>
          <Text style={styles.value}>
            {tokenData?.patient?.birthday ?? "none"}
          </Text>

          <Text style={styles.label}>Contact</Text>
          <Text style={styles.value}>
            {tokenData?.patient?.contact_number ?? "none"}
          </Text>

          <Text style={styles.label}>Note</Text>
          <Text style={styles.value}>
            {tokenData?.patient?.illness_note ?? "none"}
          </Text>

                    <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>
            {tokenData?.status ?? "none"}
          </Text>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
  info: { fontSize: 14, color: "#444", marginBottom: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    backgroundColor: "#fafafa",
  },
  label: { fontSize: 12, color: "#666", marginTop: 8 },
  value: { fontSize: 16, color: "#222" },
  cancelButton: {
    backgroundColor: "#ff3b30",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
