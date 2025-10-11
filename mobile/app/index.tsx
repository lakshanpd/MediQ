import { Image, StatusBar, View, Text, Pressable} from "react-native";
import { MediQImages } from "@/constants/theme";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { useUser } from "@/contexts/userContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const { setUserRole } = useUser();

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
  }, []);

  const onPressPatient = async () => {
    setUserRole("patient");
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
              onPress={() => console.log("Doctor pressed")}
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
              className="w-40 h-42 bg-mediq-lightest-blue rounded-3xl items-center p-3 ml-6 shadow-md active:scale-95"
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
