import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { Platform } from "react-native";

const DEVICE_TOKEN_KEY = process.env.EXPO_PUBLIC_DEVICE_TOKEN_KEY ?? "mediq_device_token";

/**
 * Generates a unique identifier string
 */
function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const platformPrefix = Platform.OS === 'ios' ? 'ios' : 'android';
  return `${platformPrefix}_${timestamp}_${randomPart}`;
}

/**
 * Returns the saved device id if available,
 * otherwise generates a new unique device id, saves it locally, and returns it.
 */
export async function getDeviceID(): Promise<string> {
  try {
    // 1️⃣ Check if we already saved a device id
    const savedID = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    if (savedID) {
      console.log("✅ Using saved device ID:", savedID);
      return savedID;
    }

    // 2️⃣ Generate new unique device ID
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      deviceName: Device.deviceName || 'Unknown Device',
      modelName: Device.modelName || 'Unknown Model',
      brand: Device.brand || 'Unknown Brand',
    };

    // Create a unique token combining generated ID with basic device info
    const uniqueId = generateUniqueId();
    const deviceID = `${uniqueId}_${deviceInfo.platform}_${deviceInfo.brand?.toLowerCase().replace(/\s+/g, '')}`;

    // 3️⃣ Save the new device ID
    await AsyncStorage.setItem(DEVICE_TOKEN_KEY, deviceID);
    console.log("🆕 New device ID generated:", deviceID);
    console.log("📱 Device info:", deviceInfo);

    // 4️⃣ Return the device ID
    return deviceID;
  } catch (error) {
    console.error("❌ Error getting device ID:", error);

    // 5️⃣ Fallback: generate a simple token if there's an error
    const fallbackID = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    console.log("🔄 Using fallback device ID:", fallbackID);
    return fallbackID;
  }
}

/**
 * Clears the saved device ID (useful for logout/reset)
 */
export async function clearDeviceID(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
    console.log("🗑️ Device ID cleared");
  } catch (error) {
    console.error("❌ Error clearing device ID:", error);
  }
}

/**
 * Gets device information without the token
 */
export async function getDeviceInfo() {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    deviceName: Device.deviceName || 'Unknown Device',
    modelName: Device.modelName || 'Unknown Model',
    brand: Device.brand || 'Unknown Brand',
    isDevice: Device.isDevice,
  };
}