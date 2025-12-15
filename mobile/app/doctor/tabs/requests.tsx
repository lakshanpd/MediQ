import React from "react";
import { View, Text, StyleSheet, FlatList, Alert, StatusBar, Pressable } from "react-native";
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

// Format: "2025 Oct, 15 (Today)"
function formatHeaderDate(dateObj: Date) {
  const year = dateObj.getFullYear();
  const month = dateObj.toLocaleString("default", { month: "short" });
  const day = dateObj.getDate();
  
  const now = new Date();
  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear();

  return `${year} ${month},${day} ${isToday ? "(Today)" : ""}`;
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

  const pendingTokens = (doctorTokens || []).filter(t => t.status === 'pending');

  const enrichedTokens = pendingTokens.map(token => {
    const session = doctorSessions?.find(s => s.id === token.session_id || s.id === token.sessionId);
    return {
      ...token,
      session
    };
  }).filter(item => item.session); // Remove tokens with missing sessions

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
      <View className="bg-mediq-lightest-grey rounded-2xl p-4 mb-2 mt-4 relative">
        {/* Header: Date, Time, Chevron */}
        <Pressable onPress={() => toggleExpand(item.id)}>
            <View className="flex-row justify-between items-start">
                <View className="flex-1">
                    <Text className="text-xl font-bold text-mediq-blue">
                    {formatHeaderDate(sessionDate)}
                    </Text>
                    <Text className="text-base font-medium text-mediq-light-blue mb-2">
                    Medihelp Ratmalana
                    {/* {item.session.location || doctorMetaData?.hospital || "Medihelp, Ratmalana"} */}
                    </Text>
                </View>
                <View className="items-end -mt-2">
                    <View className="flex-row items-center">
                        <Text className="text-sm text-mediq-text-black font-semibold  mt-6">
                        {formatSessionTimeRange(item.session.start_time, item.session.end_time)}
                        </Text>
                        <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={28} 
                            color="#9CA3AF" 
                        />
                    </View>
                </View>
            </View>
        </Pressable>

        {/* small line */}
        <View className="border-b border-mediq-light-blue mb-3" />

        {/* Patient Info */}
        <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-2">
                <Text className="text-sm text-mediq-blue font-bold mb-0.5">Name</Text>
                <Text className="text-base font-semibold text-mediq-text-black mb-2">
                    {item.patient.name || "Unknown Patient"}
                </Text>
            </View>
            
            <View className="flex-row space-x-6">
                <View className="items-center mr-4">
                    <Text className="text-sm text-mediq-blue font-bold mb-0.5">Age</Text>
                    <Text className="text-base font-semibold text-mediq-text-black">
                        {item.patient?.age || item.patient_age || "N/A"}
                    </Text>
                </View>
                <View className="items-center">
                    <Text className="text-sm text-mediq-blue font-bold mb-0.5">Gender</Text>
                    <Text className="text-base font-semibold text-mediq-text-black">
                        {item.patient?.gender || item.patient_gender || "N/A"}
                    </Text>
                </View>
            </View>
        </View>

        {/* Expanded Content: Illness */}
        {isExpanded && (
            <View className="mb-2">
                <Text className="text-sm text-mediq-blue font-bold mb-0.5">Illness</Text>
                <Text className="text-base font-normal text-mediq-text-black">
                    {item.patient.illness_note || "No illness description provided."}
                </Text>
            </View>
        )}

        {/* Actions */}
        <View className="flex-row justify-end space-x-3">
            <Pressable
                onPress={() => handleReject(item.id, setUpdatingIds)}
                className="bg-mediq-red mr-3 px-4 py-2.5 rounded-lg active:opacity-80"
            >
                <Text className="text-white text-sm font-bold">Reject</Text>
            </Pressable>
            <Pressable
                onPress={() => handleAccept(item.id, setUpdatingIds)}
                className="bg-mediq-green px-4 py-2.5 rounded-lg active:opacity-80"
            >
                <Text className="text-white text-sm font-bold">Accept</Text>
            </Pressable>
        </View>
      </View>
    );
  };


  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="flex-row">
        <FlatList
            data={enrichedTokens}
            keyExtractor={(item) => item.id}
            renderItem={renderRequestCard}
            contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 22 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View className="items-center justify-center mt-20">
                    <Text className="text-gray-400">No pending requests</Text>
                </View>
            }
        />
        </View>
        <View className="flex-row justify-end mt-4 space-x-3">
          {/* TODO: Implement Accept All functionality */}
            <Pressable
                onPress={() => Alert.alert("Accept All", "Accept all functionality")}
                className="bg-mediq-light-blue mr-4 px-8 py-2.5 rounded-lg active:opacity-80"
            >
                <Text className="text-white text-sm font-bold">Accept All</Text>
            </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}