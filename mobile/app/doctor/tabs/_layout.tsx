import { MediQImages } from "@/constants/theme";
import { Tabs } from "expo-router";
import React from "react";
import { Image } from "react-native";

export default function DoctorLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0564F5",
        tabBarInactiveTintColor: "#404040",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 100,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "600",
          marginTop: 5,
        }
      })}
    >
      <Tabs.Screen
        name="queue"
        options={{
          title: "Sessions",
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={MediQImages.navbar_icon_sessions}
              style={{ tintColor: color, width: 28, height: 28 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={MediQImages.navbar_icon_requests}
              style={{ tintColor: color, width: 28, height: 28}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={MediQImages.navbar_icon_settings}
              style={{ tintColor: color, width: 28, height: 28 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
