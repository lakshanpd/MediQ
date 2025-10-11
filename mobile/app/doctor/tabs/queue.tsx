import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useDoctor } from "@/contexts/doctorContext";

function formatMaybeTimestamp(v: any) {
  if (!v) return "";
  // Firestore timestamp from web SDK may be an object with seconds/nanoseconds
  if (typeof v === "object" && v.seconds) {
    return new Date(v.seconds * 1000).toLocaleString();
  }
  try {
    return new Date(v).toLocaleString();
  } catch (e) {
    return String(v);
  }
}

export default function QueueScreen() {
  const { doctorSessions, doctorTokens } = useDoctor();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Doctor Queue Test</Text>

      <FlatList
        data={doctorSessions ?? []}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontWeight: '600' }}>{item.id}</Text>
            <Text>Start: {formatMaybeTimestamp(item.start_time)}</Text>
            <Text>End: {formatMaybeTimestamp(item.end_time)}</Text>
            <Text>Status: {item.status}</Text>
          </View>
        )}
      />

      <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '700' }}>Tokens</Text>
      <FlatList
        data={doctorTokens ?? []}
        keyExtractor={(t: any) => t.id}
        renderItem={({ item }: { item: any }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#f0f0f0' }}>
            <Text style={{ fontWeight: '600' }}>Token: {item.id}</Text>
            <Text>Patient: {item.patient?.name ?? '(no name)'}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Device token: {item.device_token ?? ''}</Text>
            <Text>Created: {formatMaybeTimestamp(item.created_at)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  text: { fontSize: 18, fontWeight: "600" },
});