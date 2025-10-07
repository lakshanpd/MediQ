import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { useUser } from "@/contexts/userContext";

export default function WelcomeScreen() {
  const router = useRouter();
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
    router.push("./patient")
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>You are, </Text>

      <Button title="Doctor" onPress={() => null} />
      <View style={{ height: 10 }} />
      <Button title="Patient" onPress={onPressPatient} />
    </View>
  );
}
