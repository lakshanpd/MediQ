import { Image, StatusBar, View, Text, Pressable } from "react-native";
import { MediQImages } from "@/constants/theme";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { UserProvider, useUser } from "@/contexts/userContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";

export default function WelcomeScreen() {
  const { setUserRole, userState } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // wait for userState to be available
    if (!userState || !userState.role) return;

    // only route when we are on the root path
    if (pathname === "/" && userState.role === "patient") {
      switch (userState.patientStatus) {
        case "form":
          router.push("/patient/form");
          break;
        case "pending":
          router.push("/patient/status/pending");
          break;
        case "accepted":
          router.push("/patient/status/accepted");
          break;
        case "rejected":
          router.push("/patient/status/rejected");
          break;
        default:
          router.push("/patient/form");
          break;
      }
    }
  }, [userState.role, userState.patientStatus,]);

  const onPressPatient = async () => {
    setUserRole("patient");
  };

  const onPressDoctor = async () => {
    setUserRole("doctor");
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

      <SafeAreaView className="flex-1 justify-center items-center px-5">
        <View className="flex-1 items-center px-6 pt-12">
          <Image
            source={MediQImages.logo}
            className="w-32 h-32 mt-20"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-mediq-text-black mt-4">
            Welcome to <Text className="text-mediq-blue">Medi<Text className="text-mediq-dark-grey">Q</Text></Text>
          </Text>

          <Text className="text-md text-mediq-dark-grey mt-2">
            Smart Queuing for Smarter Care
          </Text>

          <Text className="text-2xl font-bold text-mediq-text-black mt-28">Choose Yourself</Text>


          <View className="flex-row justify-center items-center mt-16">
            <Pressable
              onPress={onPressDoctor}
              className="w-40 h-42 bg-mediq-lightest-blue rounded-3xl items-center p-3 mr-5 shadow-md active:scale-95"
            >
              <View className="-mt-12">
                <Image
                  source={MediQImages.doctor_avatar_main}
                  className="w-40 h-40"
                />
              </View>
              <View className="mt-2">
                <Text className="text-2xl text-mediq-blue font-bold">Doctor</Text>
              </View>

            </Pressable>

            <Pressable
              onPress={onPressPatient}
              className="w-40 h-42 bg-mediq-lightest-blue rounded-3xl items-center p-3 ml-5 shadow-md active:scale-95"
            >
              <View className="-mt-12">
                <Image
                  source={MediQImages.patient_avatar_main}
                  className="w-40 h-40"
                />
              </View>
              <View className="mt-2">
                <Text className="text-2xl text-mediq-blue font-bold">Patient</Text>
              </View>
            </Pressable>

          </View>
        </View>
      </SafeAreaView>

    </View>
  );
}
