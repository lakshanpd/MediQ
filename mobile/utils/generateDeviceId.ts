import { Platform } from "react-native";

export function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const platformPrefix = Platform.OS === 'ios' ? 'ios' : 'android';
  return `${platformPrefix}_${timestamp}_${randomPart}`;
}