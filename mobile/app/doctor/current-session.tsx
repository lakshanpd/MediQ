import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Pressable, StatusBar, Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDoctor } from "@/contexts/doctorContext";
import { db } from "@/firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

/* Helpers copied from session-details to keep UI/format consistent */

// parse Firestore timestamp or ISO/string
function getDateFromValue(v: any): Date {
  if (!v) return new Date();
  if (typeof v === "object" && v.seconds) return new Date(v.seconds * 1000);
  return new Date(v);
}

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

function formatTimeRange(start: any, end: any) {
  const s = getDateFromValue(start);
  const e = getDateFromValue(end);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${fmt(s)} - ${fmt(e)}`;
}

function formatElapsed(start: Date, now = new Date()) {
  const diff = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000)); // seconds
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (hrs > 0) return `${hrs}hr ${mins}min`;
  return `${mins}min`;
}

export default function CurrentSessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>(); // session id passed as param
  const { doctorSessions, doctorTokens, doctorMetaData } = useDoctor();

  const session = useMemo(() => doctorSessions?.find((s) => s.id === id), [doctorSessions, id]);
  const sessionTokens = useMemo(
    () => (doctorTokens || []).filter((t: any) => t.session_id === id || t.sessionId === id),
    [doctorTokens, id]
  );

  // token display order: accepted -> in_progress -> served/absent handled separately
  const queue = useMemo(
    () =>
      sessionTokens
        .filter((t: any) => t.status === "accepted" || t.status === "in_progress")
        .sort((a: any, b: any) => {
          // keep order stable; if you have 'position' you can use it. else by created_at
          const ta = getDateFromValue(a.created_at || a.createdAt || a.createdAt);
          const tb = getDateFromValue(b.created_at || b.createdAt || b.createdAt);
          return ta.getTime() - tb.getTime();
        }),
    [sessionTokens]
  );

  // current token index points into queue; default 0 or first 'in_progress'
  const initialIndex = queue.findIndex((t: any) => t.status === "in_progress");
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const currentToken = queue[currentIndex];

  // counts
  const servedCount = sessionTokens.filter((t: any) => t.status === "served").length;
  const absentCount = sessionTokens.filter((t: any) => t.status === "absent" || t.status === "absent").length;

  // elapsed time since session.start_time (fallback to now if missing)
  const sessionStart = session ? getDateFromValue(session.start_time || session.created_at || new Date()) : new Date();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30 * 1000); // update every 30s
    return () => clearInterval(timer);
  }, []);

  // update token status in firestore
  const updateTokenStatus = async (tokenId: string, status: string) => {
    try {
      const ref = doc(db, "tokens", tokenId);
      await updateDoc(ref, { status, updated_at: serverTimestamp() });
    } catch (err) {
      Alert.alert("Error", "Failed to update token status");
    }
  };

  // advance to next token in queue
  const goToNextToken = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) setCurrentIndex(nextIndex);
    else {
      Alert.alert("End of queue", "No more tokens in this session.");
    }
  };

  // mark served
  const markServed = async () => {
    if (!currentToken) return;
    await updateTokenStatus(currentToken.id, "served");
    goToNextToken();
  };

  // mark absent
  const markAbsent = async () => {
    if (!currentToken) return;
    await updateTokenStatus(currentToken.id, "absent");
    goToNextToken();
  };

  // pause / continue session
  const togglePause = async () => {
    if (!session) return;
    const ref = doc(db, "sessions", session.id);
    try {
      if (session.status === "active") {
        await updateDoc(ref, { status: "paused", updated_at: serverTimestamp() });
        Alert.alert("Session paused");
      } else {
        await updateDoc(ref, { status: "active", updated_at: serverTimestamp() });
        Alert.alert("Session resumed");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update session status");
    }
  };

  // when marking next token as in_progress (when navigating), optionally set status to in_progress
  const setTokenInProgress = async (tokenId?: string) => {
    if (!tokenId) return;
    try {
      // set the selected token to in_progress
      const ref = doc(db, "tokens", tokenId);
      await updateDoc(ref, { status: "in_progress", updated_at: serverTimestamp() });
    } catch (err) {
      // ignore
    }
  };

  // when currentToken changes, mark it in_progress
  useEffect(() => {
    if (currentToken && currentToken.status !== "in_progress") {
      setTokenInProgress(currentToken.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentToken?.id]);

  if (!session) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Loading session...</Text>
      </View>
    );
  }

  // UI render
  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 py-4">
          <Pressable
            onPress={() => router.back()}
            className="w-12 h-12 border border-gray-300 rounded-2xl flex items-center justify-center bg-white active:bg-gray-50"
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </Pressable>
          <Text className="text-xl font-bold text-mediq-text-black ml-4">Current Session</Text>
        </View>

        <View className="flex-1 mx-4 rounded-2xl border-mediq-light-blue border-2 p-4 mb-4">
          {/* Session header */}
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-2xl font-bold text-mediq-blue">
                {formatHeaderDate(getDateFromValue(session.start_time))}
              </Text>
              <Text className="text-sm text-blue-400">{session.location || doctorMetaData?.hospital || "Medihelp, Ratmalana"}</Text>
            </View>
            <View className="items-end">
              <Text className="text-base text-mediq-text-black font-semibold">
                {formatTimeRange(session.start_time, session.end_time)}
              </Text>
              <Text className={`mt-2 font-semibold ${session.status === "active" ? "text-green-600" : "text-yellow-600"}`}>
                {session.status === "active" ? "Active" : session.status === "paused" ? "Paused" : session.status}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View className="flex-row justify-between mt-4 px-2 mb-4">
            <View className="items-center">
              <Text className="text-lg font-bold">{servedCount}</Text>
              <Text className="text-xs text-mediq-blue">Served</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold">{absentCount}</Text>
              <Text className="text-xs text-mediq-blue">Absent</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold">{formatElapsed(sessionStart, now)}</Text>
              <Text className="text-xs text-mediq-blue">Elapsed Time</Text>
            </View>
          </View>

          {/* Current token card */}
          <View className="bg-mediq-lightest-grey rounded-2xl p-6 mb-4">
            <Text className="text-5xl font-bold text-mediq-blue text-center mb-4">
              {currentToken ? (currentToken.queue_no || currentIndex + 1) : "--"}
            </Text>

            {currentToken ? (
              <View>
                <View className="mb-3">
                  <Text className="text-xs text-mediq-blue font-bold mb-0.5">Name</Text>
                  <Text className="text-base font-semibold text-mediq-text-black">{currentToken.patient?.name || currentToken.patient_name || "Unknown"}</Text>
                </View>

                <View className="flex-row space-x-8 mb-3">
                  <View>
                    <Text className="text-xs text-mediq-blue font-bold mb-0.5">Age</Text>
                    <Text className="text-sm font-medium text-mediq-text-black">{currentToken.patient?.age || currentToken.patient_age || "N/A"}</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-mediq-blue font-bold mb-0.5">Gender</Text>
                    <Text className="text-sm font-medium text-mediq-text-black">{currentToken.patient?.gender || currentToken.patient_gender || "N/A"}</Text>
                  </View>
                </View>

                {currentToken.illness_note ? (
                  <>
                    <Text className="text-xs text-mediq-blue font-bold mb-0.5">Illness</Text>
                    <Text className="text-sm text-gray-600 mb-2">{currentToken.illness_note}</Text>
                  </>
                ) : null}
              </View>
            ) : (
              <View className="items-center">
                <Text className="text-base text-gray-500">No active token</Text>
              </View>
            )}
          </View>

          {/* Footer actions */}
          <View className="flex-row py-4 justify-between">
            <Pressable
              onPress={togglePause}
              className="bg-mediq-yellow rounded-xl px-6 py-3 items-center justify-center active:opacity-80"
            >
              <Text className="text-white font-bold text-lg">{session.status === "active" ? "Pause" : "Continue"}</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert("Mark Absent", "Mark this patient as absent?", [
                  { text: "No" },
                  { text: "Yes", onPress: markAbsent },
                ])
              }
              className="bg-mediq-red rounded-xl px-6 py-3 items-center justify-center active:opacity-80"
            >
              <Text className="text-white font-bold text-lg">Absent</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert("Mark Served", "Mark this patient as served?", [
                  { text: "No" },
                  { text: "Yes", onPress: markServed },
                ])
              }
              className="flex-row bg-mediq-blue rounded-xl px-6 py-3 items-center justify-center space-x-2 active:opacity-80"
            >
              <Text className="text-white font-bold text-lg">Served</Text>
              <Ionicons name="checkmark" size={18} color="white" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}