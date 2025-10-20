import { useDoctor } from "@/contexts/doctorContext";
import { MediQImages } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

function getMillisFromTimestamp(v: any) {
  if (!v) return 0;
  if (typeof v === "object") {
    if (typeof v.toMillis === "function") return v.toMillis();
    if (typeof v.seconds === "number") return v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1000000);
  }
  const parsed = Date.parse(String(v));
  return isNaN(parsed) ? 0 : parsed;
}

function formatDuration(start: any, end: any) {
  const s = getMillisFromTimestamp(start);
  const e = getMillisFromTimestamp(end);
  if (!s || !e || e <= s) return "";
  const diff = e - s;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

export default function QueueScreen() {
  const { doctorSessions, doctorTokens } = useDoctor();
  const router = useRouter();

  // determine current active session (now between start_time and end_time)
  const nowMs = Date.now();
  const currentSession = (doctorSessions ?? []).find((s: any) => {
    const startMs = getMillisFromTimestamp(s.start_time);
    const endMs = getMillisFromTimestamp(s.end_time);
    return startMs <= nowMs && nowMs <= endMs;
  });
  const currentSessionId = currentSession ? (currentSession.sessionId ?? currentSession.id) : null;

  // show only accepted tokens that belong to the current session, sorted by created_at ascending (oldest first)
  const acceptedTokens = (doctorTokens ?? []).filter((t: any) => {
    if (t.status !== "accepted") return false;
    const sid = t.session_id ?? t.sessionId ?? t.session;
    if (!currentSessionId) return false;
    return String(sid) === String(currentSessionId);
  });
  const acceptedTokensSorted = [...acceptedTokens].sort((a: any, b: any) => {
    return getMillisFromTimestamp(a.created_at) - getMillisFromTimestamp(b.created_at);
  });

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="flex-row justify-end items-center  ">
          <Pressable
            onPress={() => router.push("/doctor/add-session")}
            className="w-20 h-20  flex items-center justify-center active:scale-95 ">
            <Image source={MediQImages.session_add_icon} className="w-10 h-10 mr-5 mt-3" />
          </Pressable>
        </View>
      {currentSession ? (
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionLabel}>Current session</Text>
          <Text style={styles.sessionTimes}>{formatMaybeTimestamp(currentSession.start_time)} — {formatMaybeTimestamp(currentSession.end_time)}</Text>
          <Text style={styles.sessionDuration}>{formatDuration(currentSession.start_time, currentSession.end_time)}</Text>
        </View>
      ) : null}
      {currentSessionId ? (
        <FlatList
        data={acceptedTokensSorted}
        keyExtractor={(t: any) => t.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>{item.patient?.name ?? "(no name)"}</Text>
              <Text style={styles.sessionId}>Session: {item.session_id ?? item.sessionId ?? "-"}</Text>
            </View>

            <Text style={styles.field}>Birthday: {item.patient?.birthday ?? item.birthday ?? ""}</Text>
            <Text style={styles.field}>Contact: {item.patient?.contact_number ?? item.contact_number ?? ""}</Text>
            <Text style={styles.field}>Note: {item.patient?.illness_note ?? item.illness_note ?? ""}</Text>

            <View style={styles.rowRight}>
              <Text style={styles.small}>Created: {formatMaybeTimestamp(item.created_at)}</Text>
              <Text style={styles.small}>Status: {item.status}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#666' }}>No accepted tokens</Text>
          </View>
        )}
      />
      ) : (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>No active session right now</Text>
        </View>
      )}
      </SafeAreaView>
    </View>
  
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb" },
  text: { fontSize: 18, fontWeight: "600", padding: 12 },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  sessionId: { fontSize: 12, color: "#666" },
  field: { fontSize: 14, color: "#333", marginBottom: 4 },
  rowRight: { marginTop: 8, flexDirection: "row", justifyContent: "space-between" },
  small: { fontSize: 12, color: "#777" },
  sessionHeader: { padding: 12, backgroundColor: '#fff', margin: 12, borderRadius: 10, alignItems: 'flex-start' },
  sessionLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  sessionTimes: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  sessionDuration: { fontSize: 12, color: '#555' },
});