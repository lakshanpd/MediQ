import React from "react";
import { Stack } from "expo-router";

// This layout exposes two child routes:
// - /doctor/login (login screen)
// - /doctor/tabs/*  (the tabbed dashboard, implemented in doctor/tabs/_layout.tsx)
export default function DoctorLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
    </Stack>
  );
}
