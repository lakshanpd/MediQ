import { useUser } from "@/contexts/userContext";
import { router, Stack, usePathname, useRouter } from "expo-router";
import { use, useEffect } from "react";
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
  const { userState } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // wait until userState is available
    if (!userState) return;

    // determine target route for the current patient status
    const target = (() => {
      switch (userState.patientStatus) {
        case "pending":
          return "/patient/status/pending";
        case "accepted":
          return "/patient/status/accepted";
        case "rejected":
          return "/patient/status/rejected";
        case "form":
        default:
          return "/patient/form";
      }
    })();

    // avoid navigating if already on the target route
    if (!pathname || pathname.startsWith(target)) return;

    // use replace to avoid stacking history and schedule on next tick
    const t = setTimeout(() => router.replace(target), 0);
    return () => clearTimeout(t);
  }, [userState, pathname, router]);

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
