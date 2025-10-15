import { MediQImages } from "@/constants/theme";
import { useUser } from "@/contexts/userContext";
import { db } from "@/firebaseConfig";
import { useDoctorListener } from "@/hooks/useDoctorListener";
import { useSessionListener } from "@/hooks/useSessionListener";
import { useTokenListener } from "@/hooks/useTokenListener";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React from "react";
import { Alert, Image, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PatientPendingScreen() {
  const { userState, setPatientStatus } = useUser();
  const tokenData = useTokenListener(userState?.userData?.tokenId ?? null);
  const { sessionData } = useSessionListener(tokenData?.session_id ?? null);
  const { doctorData } = useDoctorListener(sessionData?.doctor_id ?? null);

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

  if (tokenData.status === "rejected") {
    setPatientStatus && setPatientStatus("rejected");
    return null;
  }

  if (tokenData.status === "pending") {
    return (
      <View className="flex-1 bg-white"> 
            <StatusBar barStyle="dark-content" />
      
            <Image
              source={MediQImages.main_bg_top}
              className="absolute inset-0 w-full h-full"
              resizeMode="cover"
              accessible={false}
            />
            <SafeAreaView className="flex-1">
          <View className="flex items-center mb-4 ">
            <Image
              source={MediQImages.mediq_inline_logo}
              className="w-48 h-20  flex mt-10 mb-10"
              resizeMode="contain"
            />
              <Text className="text-2xl font-bold text-mediq-blue text-center mb-2 mx-8 ">
              Your token request has been submitted to the doctor.
            </Text>

            <Text className="text-base text-mediq-text-black text-center mx-8">
              You will receive a notification once your token is accepted.
            </Text>

          </View>
          <View className="bg-mediq-lightest-grey rounded-2xl p-6 mx-6 mt-2 mb-6 flex-1">
            <Text className="text-2xl font-bold text-mediq-blue ">
              Dr. {doctorData?.first_name || 'Loading...'} {doctorData?.last_name || ''}
            </Text>
            <Text className="text-lg font-normal text-mediq-text-black mb-2">
               {doctorData?.specialization || 'Loading...'}
            </Text>
          <View className = "flex-row justify-between mt-3">
            <Text className="text-xl text-mediq-text-black font-semibold">
              {sessionData?.start_time ? new Date(sessionData.start_time).toLocaleDateString() : 'Loading...'}
            </Text>
            <Text className="text-xl text-mediq-text-black font-semibold">
              {sessionData?.start_time && sessionData?.end_time 
                  ? `${new Date(sessionData.start_time).toLocaleTimeString()} - ${new Date(sessionData.end_time).toLocaleTimeString()}`
                  : 'Loading...'
              }
            </Text>
            </View>
            <View className="flex-row justify-end mt-2">
              <Text className="text-lg font-medium text-mediq-light-blue mb-2">
                Medihelp, Ratmalana
              </Text>
            </View>
          <View className="border-b border-mediq-blue mb-2" />

          <View className="flex mt-2 mb-3">
            <Text className="text-md font-bold text-mediq-blue">
              Name
            </Text>
            <Text className="text-lg text-mediq-text-black font-medium pl-2">
               {tokenData?.patient?.name || 'N/A'}
            </Text>
          </View>
          <View className="flex mb-3">
            <Text className="text-md font-bold text-mediq-blue">
              Birthday
            </Text>
            <Text className="text-lg text-mediq-text-black font-medium pl-2">
              {tokenData?.patient?.birthday || 'N/A'}
            </Text>
          </View>
          <View className="flex mb-3">
            <Text className="text-md font-bold text-mediq-blue">
              Contact
            </Text>
            <Text className="text-lg text-mediq-text-black font-medium pl-2">
              {tokenData?.patient?.contact_number || 'N/A'}
            </Text>
          </View>
          <View className="border-b border-mediq-blue mb-2" />

          <View className="flex items-center justify-center mt-2 mb-3 ">
            <Text className="text-2xl font-bold text-mediq-blue">
              Pending
            </Text>
            </View>

          </View>



          <View className="h-16 px-6 mb-6  ">
            <Pressable
              onPress={handleCancel}
              className="h-16 rounded-2xl bg-mediq-red flex-row items-center justify-center active:scale-95">
              <Text className="text-xl text-white font-bold">
                Cancel
              </Text>
            
                    </Pressable>
                  </View>
          
          </SafeAreaView>
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
