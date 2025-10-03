import { Redirect, Stack } from "expo-router";
import { useState } from "react";

export default function PatientLayout() {
  const [initialRoute, setInitialRoute] = useState<"/patient/form"| "/patient/pending" | "/patient/rejected" | "/patient/accepted">("/patient/form");

  return (
    <>
      <Stack>
        <Stack.Screen name="form" options={{ title: "Form"}} />
        <Stack.Screen name="pending" options={{ title: "Pending"}} />
        <Stack.Screen name="rejected" options={{ title: "Rejected"}} />
        <Stack.Screen name="accepted" options={{ title: "Accepted"}} />
      </Stack>
      <Redirect href={initialRoute} />
    </>
  );
}
