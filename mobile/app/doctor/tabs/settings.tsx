import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  StatusBar,
  Image,
  Pressable,
  Switch,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useUser } from "@/contexts/userContext";
import { useDoctor } from "@/contexts/doctorContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { MediQImages } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { resetUser } = useUser();
  const { doctorMetaData } = useDoctor();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    try {
      // Sign out from Firebase (if auth is configured)
      if (auth && typeof signOut === "function") {
        await signOut(auth);
      }

      // Reset local user state
      await resetUser();

      // Optional: show confirmation
      Alert.alert("Logged out", "You have been signed out.");
    } catch (err) {
      console.error("Logout error", err);
      const error: any = err;
      Alert.alert("Logout failed", error?.message || String(error));
    }
  };

  const doctorName = doctorMetaData ? `${doctorMetaData.first_name} ${doctorMetaData.last_name}` : "Doctor";
  const specialization = doctorMetaData?.specialization || "General Practitioner";
  const doctorId = doctorMetaData?.id || "Unknown ID";

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">

        {/* TODO: Add a decorative background image and doctor id */}
        {/* Profile Avatar Section */}
        <View className="items-center mb-4 mt-10">
          <View className="w-32 h-32 rounded-full bg-purple-100 items-center justify-center mb-3">
            <Ionicons name="person-outline" size={60} color="#7c3aed" />
          </View>

          <Text className="text-2xl font-bold text-mediq-blue text-center">
            {doctorName}
          </Text>
          <Text className="text-lg text-mediq-text-black font-medium text-center mt-1">
            {specialization}
          </Text>
        </View>

        {/* Menu Options */}
        <View className="px-6 mt-6 space-y-4">

          {/* TODO: Add navigation to Edit Profile and Change Password screens */}
          {/* Edit Profile */}
          <Pressable
            onPress={() => Alert.alert("Edit Profile", "Feature coming soon")}
            className="flex-row mb-4 items-center justify-between bg-gray-100 p-4 rounded-2xl active:opacity-70"
          >
            <Text className="text-base font-bold text-mediq-text-black ml-2">
              Edit Profile
            </Text>
            <Ionicons name="person-outline" size={22} color="#333" />
          </Pressable>

          {/* Change Password */}
          <Pressable
            onPress={() =>
              Alert.alert("Change Password", "Feature coming soon")
            }
            className="flex-row mb-4 items-center justify-between bg-gray-100 p-4 rounded-2xl active:opacity-70"
          >
            <Text className="text-base font-bold text-mediq-text-black ml-2">
              Change Password
            </Text>
            <Ionicons name="lock-closed-outline" size={22} color="#333" />
          </Pressable>

          {/* TODO: Implement actual notification settings functionality */}
          {/* Notifications */}
          <View className="flex-row items-center justify-between bg-gray-100 p-4 rounded-2xl">
            <Text className="text-base font-bold text-mediq-text-black ml-2">
              Notifications
            </Text>
            <Switch
              trackColor={{ false: "#767577", true: "#60a5fa" }}
              thumbColor={notificationsEnabled ? "#2563eb" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  Alert.alert("Notifications", `Notifications turned ${!notificationsEnabled ? "ON" : "OFF"}`);
              }}
              value={notificationsEnabled}
            />
          </View>
        </View>

        {/* Logout Button - Fixed at bottom */}
        <View className="flex-1 justify-end px-6 pt-2">
          <Pressable
            onPress={handleLogout}
            className="w-full bg-mediq-blue py-4 rounded-xl flex-row items-center justify-center space-x-2 active:opacity-90"
          >
            <Text className="text-white text-lg font-bold">Logout</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
