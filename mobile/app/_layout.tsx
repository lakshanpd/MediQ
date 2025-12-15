import React from "react";
import { Stack } from "expo-router";
import { UserProvider } from "@/contexts/userContext";
import "./globals.css";

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="patient" options={{ headerShown: false }} />
        <Stack.Screen name="doctor" options={{ headerShown: false }} />
      </Stack>
    </UserProvider>
  );
}
