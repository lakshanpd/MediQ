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
          backgroundColor: "#F2F2F7",
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
              style={{ tintColor: color, width: 26, height: 26 }}
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
              style={{ tintColor: color, width: 26, height: 26}}
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
              style={{ tintColor: color, width: 26, height: 26 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
