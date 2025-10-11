import React from "react";
import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

// This layout exposes two child routes:
// - /doctor/login (login screen)
// - /doctor/tabs/*  (the tabbed dashboard, implemented in doctor/tabs/_layout.tsx)

function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.replace("/")}>
      <Text style={{ color: "#007AFF", marginLeft: 15 }}>← Back</Text>
    </TouchableOpacity>
  );
}

export default function DoctorLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: "Form",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
    </Stack>
  );
}
