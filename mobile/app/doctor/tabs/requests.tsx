import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, StatusBar, Pressable } from "react-native";
import { db } from "@/firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useDoctor } from "@/contexts/doctorContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Helper to parse Firestore timestamps or ISO strings
function getDateFromValue(v: any): Date {
  if (!v) return new Date();
  if (typeof v === "object" && v.seconds) {
    return new Date(v.seconds * 1000);
  }
  return new Date(v);
}

// Format: "Oct, 15 (Today)"
function formatSessionDate(dateObj: Date) {
  const now = new Date();
  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    dateObj.getDate() === tomorrow.getDate() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getFullYear() === tomorrow.getFullYear();

  const month = dateObj.toLocaleString("default", { month: "short" });
  const day = dateObj.getDate();
  const dayName = dateObj.toLocaleString("default", { weekday: "long" });

  let suffix = `(${dayName})`;
  if (isToday) suffix = "(Today)";
  if (isTomorrow) suffix = "(Tomorrow)";

  return `${month},${day} ${suffix}`;
}

// Format: "8.00-10.30 PM"
function formatSessionTimeRange(start: any, end: any) {
  const s = getDateFromValue(start);
  const e = getDateFromValue(end);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return `${formatTime(s)} - ${formatTime(e)}`;
}

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
  const { doctorSessions, doctorTokens, doctorMetaData } = useDoctor();
  const [updatingIds, setUpdatingIds] = React.useState<Record<string, boolean>>({});
  const [expandedIds, setExpandedIds] = React.useState<Record<string, boolean>>({});


  async function handleAccept(tokenId: string, setUpdating: (s: Record<string, boolean>) => void | any) {
    try {
      setUpdatingIds((prev) => ({ ...prev, [tokenId]: true }));
      const ref = doc(db, "tokens", tokenId);
      await updateDoc(ref, { status: "accepted", updated_at: serverTimestamp() });
      setUpdatingIds((prev) => ({ ...prev, [tokenId]: false }));
    } catch (err) {
      console.error("Accept failed", err);
      setUpdatingIds((prev) => ({ ...prev, [tokenId]: false }));
      Alert.alert("Failed", "Could not accept token");
    }
  }

  async function handleReject(tokenId: string, setUpdating: (s: Record<string, boolean>) => void | any) {
    try {
      setUpdatingIds((prev) => ({ ...prev, [tokenId]: true }));
      const ref = doc(db, "tokens", tokenId);
      await updateDoc(ref, { status: "rejected", updated_at: serverTimestamp() });
      setUpdatingIds((prev) => ({ ...prev, [tokenId]: false }));
    } catch (err) {
      console.error("Reject failed", err);
      setUpdatingIds((prev) => ({ ...prev, [tokenId]: false }));
      Alert.alert("Failed", "Could not reject token");
    }
  }

  const nowMs = Date.now();
  // upcoming sessions: start_time > now
  const upcomingSessions = (doctorSessions ?? []).filter((s: any) => getMillisFromTimestamp(s.start_time) > nowMs);
  const pendingTokens = (doctorTokens || []).filter(t => t.status === 'pending');

  // 2. Attach session data to each token
  const enrichedTokens = pendingTokens.map(token => {
    const session = doctorSessions?.find(s => s.id === token.session_id || s.id === token.sessionId);
    return {
      ...token,
      session
    };
  }).filter(item => item.session); // Remove tokens with missing sessions

    // 3. Sort by session start time
  enrichedTokens.sort((a: any, b: any) => {
    const timeA = getDateFromValue(a.session.start_time).getTime();
    const timeB = getDateFromValue(b.session.start_time).getTime();
    return timeA - timeB;
  });

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

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderRequestCard = ({ item }: { item: any }) => {
    const isExpanded = expandedIds[item.id];
    const sessionDate = getDateFromValue(item.session.start_time);

    return (
      <View className="bg-mediq-lightest-grey rounded-2xl p-4 mb-4 mx-4 shadow-sm border border-gray-100">
        {/* Header: Date, Time, Chevron */}
        <Pressable onPress={() => toggleExpand(item.id)}>
            <View className="flex-row justify-between items-start">
                <View className="flex-1">
                    <Text className="text-base font-bold text-mediq-blue">
                    {formatSessionDate(sessionDate)}
                    </Text>
                    <Text className="text-xs text-blue-400 mt-1">
                    {item.session.location || doctorMetaData?.hospital || "Medihelp, Ratmalana"}
                    </Text>
                </View>
                <View className="items-end">
                    <View className="flex-row items-center">
                        <Text className="text-xs font-medium text-mediq-text-black mr-2">
                        {formatSessionTimeRange(item.session.start_time, item.session.end_time)}
                        </Text>
                        <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#6B7280" 
                        />
                    </View>
                </View>
            </View>
        </Pressable>

        {/* Divider */}
        <View className="border-b border-blue-200 my-3" />

        {/* Patient Info */}
        <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-mediq-blue mb-0.5">Name</Text>
                <Text className="text-base font-semibold text-mediq-text-black mb-2">
                    {item.patient?.name || item.patient_name || "Unknown"}
                </Text>
            </View>
            
            <View className="flex-row space-x-6">
                <View className="items-center">
                    <Text className="text-xs font-bold text-mediq-blue mb-0.5">Age</Text>
                    <Text className="text-sm font-semibold text-mediq-text-black">
                        {item.patient?.age || item.patient_age || "N/A"}
                    </Text>
                </View>
                <View className="items-center">
                    <Text className="text-xs font-bold text-mediq-blue mb-0.5">Gender</Text>
                    <Text className="text-sm font-semibold text-mediq-text-black">
                        {item.patient?.gender || item.patient_gender || "N/A"}
                    </Text>
                </View>
            </View>
        </View>

        {/* Expanded Content: Illness */}
        {isExpanded && (
            <View className="mt-2 mb-2">
                <Text className="text-xs font-bold text-mediq-blue mb-1">Illness</Text>
                <Text className="text-sm text-gray-600 leading-5">
                    {item.illness_note || item.note || "No illness description provided."}
                </Text>
            </View>
        )}

        {/* Actions */}
        <View className="flex-row justify-end space-x-3 mt-3">
            <Pressable
                onPress={() => handleReject(item.id, setUpdatingIds)}
                className="bg-mediq-red px-5 py-2 rounded-lg active:opacity-80"
            >
                <Text className="text-white text-xs font-bold">Reject</Text>
            </Pressable>
            <Pressable
                onPress={() => handleAccept(item.id, setUpdatingIds)}
                className="bg-mediq-green px-5 py-2 rounded-lg active:opacity-80"
            >
                <Text className="text-white text-xs font-bold">Accept</Text>
            </Pressable>
        </View>
      </View>
    );
  };


  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <FlatList
            data={enrichedTokens}
            keyExtractor={(item) => item.id}
            renderItem={renderRequestCard}
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View className="items-center justify-center mt-20">
                    <Text className="text-gray-400">No pending requests</Text>
                </View>
            }
        />
      </SafeAreaView>
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
  tokenActions: { flexDirection: 'row', marginTop: 10 },
  acceptButton: { backgroundColor: '#2ecc71', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8 },
  rejectButton: { backgroundColor: '#ff4d4f', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  actionText: { color: '#fff', fontWeight: '700' },
});