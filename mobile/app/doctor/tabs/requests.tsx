import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useDoctor } from "@/contexts/doctorContext";

function formatMaybeTimestamp(v: any) {
  if (!v) return "";
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

export default function RequestsScreen() {
  const { doctorSessions, doctorTokens } = useDoctor();

  const nowMs = Date.now();
  // upcoming sessions: start_time > now
  const upcomingSessions = (doctorSessions ?? []).filter((s: any) => getMillisFromTimestamp(s.start_time) > nowMs);

  // map session id -> pending tokens
  const pendingTokensBySession: Record<string, any[]> = {};
  (doctorTokens ?? []).forEach((t: any) => {
    if (t.status !== "pending") return;
    const sid = t.session_id ?? t.sessionId ?? t.session;
    if (!sid) return;
    pendingTokensBySession[String(sid)] = pendingTokensBySession[String(sid)] || [];
    pendingTokensBySession[String(sid)].push(t);
    console.log("Pending tokens for session now:", pendingTokensBySession[String(sid)]);
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upcoming Sessions & Requests</Text>

      <FlatList
        data={upcomingSessions}
        keyExtractor={(s: any) => s.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }: { item: any }) => {
          const sid = item.sessionId ?? item.id;
          const tokens = pendingTokensBySession[String(sid)] ?? [];
          return (
            <View style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>{formatMaybeTimestamp(item.start_time)} — {formatMaybeTimestamp(item.end_time)}</Text>
              <Text style={styles.sessionDuration}>{formatDuration(item.start_time, item.end_time)}</Text>

              <View style={{ marginTop: 8 }}>
                {tokens.length ? (
                  tokens.map((t) => (
                    <View key={t.id} style={styles.tokenCard}>
                      <Text style={styles.tokenName}>{t.patient?.name ?? '(no name)'}</Text>
                      <Text style={styles.tokenField}>Contact: {t.patient?.contact_number ?? t.contact_number ?? ''}</Text>
                      <Text style={styles.tokenField}>Birthday: {t.patient?.birthday ?? t.birthday ?? ''}</Text>
                      <Text style={styles.tokenField}>Note: {t.patient?.illness_note ?? t.illness_note ?? ''}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#666' }}>No pending tokens for this session</Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#666' }}>No upcoming sessions</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fb' },
  header: { fontSize: 20, fontWeight: '700', padding: 12 },
  sessionCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  sessionTitle: { fontSize: 14, fontWeight: '700' },
  sessionDuration: { fontSize: 12, color: '#666' },
  tokenCard: { backgroundColor: '#f9fbff', borderRadius: 8, padding: 10, marginTop: 8 },
  tokenName: { fontWeight: '700' },
  tokenField: { fontSize: 13, color: '#333' },
});