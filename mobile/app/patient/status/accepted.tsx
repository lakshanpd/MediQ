import { useUser } from "@/contexts/userContext";
import React from "react";
import {
  Text,
  View,
  StyleSheet,
  StatusBar,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MediQImages } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { useDoctorListener } from "@/hooks/useDoctorListener";
import { useSessionListener } from "@/hooks/useSessionListener";
import { useTokenListener } from "@/hooks/useTokenListener";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useInProgressSessionListener } from "@/hooks/useInProgressSessionListener";

export default function PatientAcceptedScreen() {
  const { userState, setPatientStatus } = useUser();
  const tokenData = useTokenListener(userState?.userData?.tokenId ?? null);
  const { sessionData } = useSessionListener(tokenData?.session_id ?? null);
  const { doctorData } = useDoctorListener(sessionData?.doctor_id ?? null);
  const { currentQueueNumber } = useInProgressSessionListener(sessionData?.id ?? null);

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
          <Text className="text-2xl font-bold text-mediq-blue text-center mx-8 ">
            {sessionData?.status === "scheduled"
              ? "Your token has been Accepted"
              : "Your Session has Started"}
          </Text>
        </View>
        <View className="flex-1 ">
          <View className={`rounded-2xl p-6 mx-6 mt-2 mb-6 ${sessionData?.status === "scheduled" 
            ? "bg-mediq-lightest-blue"
            : "bg-mediq-light-green"}`}>
            <Text className="text-2xl font-bold text-mediq-blue ">
              Dr. {doctorData?.first_name || "Loading..."}{" "}
              {doctorData?.last_name || ""}
            </Text>
            <Text className="text-lg font-normal text-mediq-text-black mb-2">
              {doctorData?.specialization || "Loading..."}
            </Text>
            <View className="flex-row justify-between mt-3">
              <Text className="text-xl text-mediq-text-black font-semibold">
                {sessionData?.start_time
                  ? new Date(sessionData.start_time).toLocaleDateString()
                  : "Loading..."}
              </Text>
              <Text className="text-xl text-mediq-text-black font-semibold">
                {sessionData?.start_time && sessionData?.end_time
                  ? `${new Date(
                    sessionData.start_time
                  ).toLocaleTimeString()} - ${new Date(
                    sessionData.end_time
                  ).toLocaleTimeString()}`
                  : "Loading..."}
              </Text>
            </View>
            <View className="flex-row justify-end mt-2">
              <Text className="text-lg font-medium text-mediq-light-blue mb-2">
                Medihelp, Ratmalana
              </Text>
            </View>
            <View className="border-b border-mediq-blue mb-2" />

            <View className="flex mt-2 mb-3">
              <Text className="text-md font-bold text-mediq-blue">Name</Text>
              <Text className="text-lg text-mediq-text-black font-medium pl-2">
                {tokenData?.patient?.name || "N/A"}
              </Text>
            </View>
            <View className="flex mb-3">
              <Text className="text-md font-bold text-mediq-blue">
                Birthday
              </Text>
              <Text className="text-lg text-mediq-text-black font-medium pl-2">
                {tokenData?.patient?.birthday || "N/A"}
              </Text>
            </View>
            <View className="flex mb-3">
              <Text className="text-md font-bold text-mediq-blue">Contact</Text>
              <Text className="text-lg text-mediq-text-black font-medium pl-2">
                {tokenData?.patient?.contact_number || "N/A"}
              </Text>
            </View>
            <View className="border-b border-mediq-blue mb-2" />

            <View className="flex-row justify-center mt-2  ">
              {sessionData?.status === "active" || sessionData?.status === "paused" ? (
            <View className="flex items-center justify-center mt-2 mr-4">
              <Text className="text-sm font-bold text-mediq-text-black">
                Current Token Number
              </Text>
              <Text className="text-8xl text-mediq-text-black font-semibold mt-3">
                {currentQueueNumber ? `${currentQueueNumber}` : "--"}
              </Text>
            </View>
              ) : null}
            <View className="flex items-center justify-center mt-2 ml-4">
              <Text className="text-sm font-bold text-mediq-blue">
                Your Token Number
              </Text>
              <Text className="text-8xl text-mediq-blue font-semibold mt-3">
                {tokenData?.queue_number ?? "--"}
              </Text>
            </View>
            </View>

            <View className="flex items-end justify-center mt-1">
              {sessionData?.status === "scheduled" ? (
                <Text className="text-base font-bold text-mediq-blue">
                  Session not started
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
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
