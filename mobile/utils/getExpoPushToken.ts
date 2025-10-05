// utils/getExpoPushToken.js
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EXPO_PUSH_TOKEN_KEY = process.env.EXPO_PUBLIC_PUSH_TOKEN_KEY ?? "";

/**
 * Returns the saved Expo Push Token if available,
 * otherwise requests permissions, generates a new token, saves it locally, and returns it.
 */
export async function getExpoPushToken() {
  try {
    // 1️⃣ Check if we already saved a token
    const savedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    if (savedToken) {
      console.log("✅ Using saved Expo push token:", savedToken);
      return savedToken;
    }

    // 2️⃣ Ensure running on a real device
    if (!Device.isDevice) {
      console.warn("⚠️ Must use physical device for push notifications");
      return null;
    }

    // 3️⃣ Request notification permission
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("🚫 Notification permissions not granted");
      return null;
    }

    // 4️⃣ Get new Expo Push Token
    const projectId = "ab03450f-a39d-41bb-b959-e6473198c95b";
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const newToken = tokenResponse.data;

    // 5️⃣ Save it for next time
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, newToken);
    console.log("🆕 New Expo push token generated:", newToken);

    // 6️⃣ Return it
    return newToken;
  } catch (error) {
    console.error("❌ Error getting Expo push token:", error);
    return null;
  }
}
