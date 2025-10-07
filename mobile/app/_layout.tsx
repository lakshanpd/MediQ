import { Stack, usePathname, useRouter } from "expo-router";
import { UserProvider, useUser } from "@/contexts/userContext";
import { use, useEffect } from "react";

function UserRedirect() {
  const { userState } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!userState || !userState.role) return;
    const goTo = (target: string) => {
      if (pathname !== target) router.push(target as any);
    };
    const timeout = setTimeout(() => {
      switch (userState.role) {
        case "patient":
          switch (userState.patientStatus) {
            case "form":
              goTo("/patient/form");
              break;
            case "pending":
              goTo("/patient/status/pending");
              break;
            default:
              goTo("/");
              break;
          }
        case "doctor":
          break;
        default:
          break;
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [userState, router]);

  return null;
}

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="patient" options={{ headerShown: false }} />
        <Stack.Screen name="doctor" options={{ headerShown: false }} />
      </Stack>
      <UserRedirect />
    </UserProvider>
  );
}
