import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, Text } from "react-native";

function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()}>
      <Text style={{ color: "#007AFF", marginLeft: 15 }}>← Back</Text>
    </TouchableOpacity>
  );
}

export default function PatientLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="form"
        options={{
          title: "Form",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen name="status/pending" options={{ title: "Pending" }} />
      <Stack.Screen name="status/rejected" options={{ title: "Rejected" }} />
      <Stack.Screen name="status/accepted" options={{ title: "Accepted" }} />
    </Stack>
  );
}
