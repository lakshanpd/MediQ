import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, Text } from "react-native";

function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.replace("/")}>
      <Text style={{ color: "#007AFF", marginLeft: 15 }}>← Back</Text>
    </TouchableOpacity>
  );
}

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
