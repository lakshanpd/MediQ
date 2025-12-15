import { Stack } from "expo-router";

export default function SessionsStackLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            {/* Root sessions list */}
            <Stack.Screen name="index" options={{ title: "Sessions" }} />
            <Stack.Screen name="add-session" options={{ title: "Add Session" }} />
            {/* Example for future nested screens inside this folder:
          <Stack.Screen name="[sessionId]" options={{ title: "Session" }} />
      */}
        </Stack>
    );
}
