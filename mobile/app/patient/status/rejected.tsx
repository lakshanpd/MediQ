import { MediQImages } from "@/constants/theme";
import { useUser } from "@/contexts/userContext";
import { useDoctorListener } from "@/hooks/useDoctorListener";
import { useSessionListener } from "@/hooks/useSessionListener";
import { useTokenListener } from "@/hooks/useTokenListener";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, StatusBar, StyleSheet, Text, View, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PatientRejectedScreen() {
  const { userState, setPatientStatus } = useUser();
  const tokenData = useTokenListener(userState?.userData?.tokenId ?? null);
  const { sessionData } = useSessionListener(tokenData?.session_id ?? null);
  const { doctorData } = useDoctorListener(sessionData?.doctor_id ?? null);

  const handleContactUs = async () => {
    const supportNumber = process.env.EXPO_PUBLIC_SUPPORT_NUMBER;
    const url = `tel:${supportNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Dialing not supported on this device");
      }
    } catch (e) {
      console.error("Failed to open dialer:", e);
    }
  };

  const handleTryAgain = () => {
    Alert.alert(
      "Try Again",
      "Are you sure you want to try again?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            setPatientStatus && setPatientStatus("form");
            router.replace({ pathname: "/patient/form" });
          },
        },
      ],
      { cancelable: true }
    );
  };

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
            Your token has been Rejected
          </Text>

        </View>
        <View className="flex-1 ">
          <View className="bg-mediq-lightest-grey rounded-2xl p-6 mx-6 mt-2 mb-6">
            <Text className="text-2xl font-bold text-mediq-blue ">
              Dr. {doctorData?.first_name || 'Loading...'} {doctorData?.last_name || ''}
            </Text>
            <Text className="text-lg font-normal text-mediq-text-black mb-2">
              {doctorData?.specialization || 'Loading...'}
            </Text>
            <View className="flex-row justify-between mt-3">
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

            <View className="flex items-center justify-center mt-2  ">
              <Text className="text-2xl font-bold text-mediq-blue">
                Rejected
              </Text>
            </View>

          </View>
        </View>


        <View className="flex-row h-16 px-6 mb-6 justify-center items-center">

          <Pressable
            onPress={handleTryAgain}
            className="h-16 w-44 rounded-2xl bg-mediq-red flex-row items-center justify-center active:scale-95 mr-2">
            <Text className="text-xl text-white font-bold">
              Try Again
            </Text>
          </Pressable>

          <Pressable
            onPress={handleContactUs}
            className="h-16 w-44 rounded-2xl bg-mediq-blue flex-row items-center justify-center active:scale-95 ml-2">
            <Text className="text-xl text-white font-bold">
              Contact Us
            </Text>
          </Pressable>
        </View>

      </SafeAreaView>
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