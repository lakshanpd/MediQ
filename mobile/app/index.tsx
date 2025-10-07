import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { getExpoPushToken } from "@/utils/getExpoPushToken";

export default function WelcomeScreen() {
  const router = useRouter();

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

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>You are, </Text>

      <Button title="Doctor" onPress={() => null} />
      <View style={{ height: 10 }} />
      <Button title="Patient" onPress={() => router.push("./patient")} />
    </View>
  );
}
