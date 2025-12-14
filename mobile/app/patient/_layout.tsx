import { Stack } from "expo-router";

export default function PatientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="form" />
      <Stack.Screen name="status/pending" />
      <Stack.Screen name="status/rejected" />
      <Stack.Screen name="status/accepted" />
    </Stack>
  );
}
