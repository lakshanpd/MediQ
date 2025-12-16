import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StatusBar, Pressable, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDoctor } from "@/contexts/doctorContext";
import { db } from "@/firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { MediQImages } from "@/constants/theme";

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
  const { doctorSessions, doctorTokens } = useDoctor();

  const session = useMemo(() => doctorSessions?.find((s) => s.id === id), [doctorSessions, id]);
  const sessionTokens = useMemo(
    () => (doctorTokens || []).filter((t: any) => t.session_id === id || t.sessionId === id),
    [doctorTokens, id]
  );

  //TODO: Correct queue management logic
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

  // mark served
  const markServed = async () => {
    if (!currentToken) return;
    await updateTokenStatus(currentToken.id, "served");
  };

  // mark absent
  const markAbsent = async () => {
    if (!currentToken) return;
    await updateTokenStatus(currentToken.id, "absent");
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
  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 py-6">
          <Pressable
            onPress={() => router.back()}
            className="w-16 h-16 rounded-2xl border border-slate-400 p-4 active:scale-95"
          >
            <Ionicons name="chevron-back" size={24} color="#6B7280" />
          </Pressable>
          <Text className="text-2xl font-bold text-mediq-text-black ml-6">
            Current Session
          </Text>
        </View>

        <View
          className={`flex-1 rounded-2xl border-2 p-4 mb-4 mx-4 ${session.status === "active"
            ? "border-mediq-green"
            : "border-mediq-yellow"
            }`}
        >
          {/* Session header */}
          <View className="flex-row justify-between">
            <Text className="text-2xl font-bold text-mediq-blue">
              {formatHeaderDate(getDateFromValue(session.start_time))}
            </Text>
            <Text
              className={`text-xl font-semibold ${session.status === "active"
                ? "text-mediq-green"
                : "text-mediq-yellow"
                }`}
            >
              {session.status === "active"
                ? "Active"
                : session.status === "paused"
                  ? "Paused"
                  : session.status}
            </Text>
          </View>

          {/* Location */}
          <Text className="text-lg font-medium text-mediq-light-blue mt-2 mb-2">
            {"Medihelp, Ratmalana"}
            {/* {item.location || doctorMetaData?.hospital || "Medihelp, Ratmalana"} */}
          </Text>

          {/* small line */}
          <View className="border-b border-mediq-light-blue mb-1 mx-3" />

          {/* Stats row */}
          <View className="flex-row justify-between mx-6 my-4 px-2">
            <View className="items-center">
              <Text className="text-lg font-semibold text-mediq-text-black">
                {servedCount}
              </Text>
              <Text className="text-base font-semibold text-mediq-blue">
                Served
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-semibold text-mediq-text-black">
                {absentCount}
              </Text>
              <Text className="text-base font-semibold text-mediq-blue">
                Absent
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-semibold text-mediq-text-black">
                {formatElapsed(sessionStart, now)}
              </Text>
              <Text className="text-base font-semibold text-mediq-blue">
                Elapsed Time
              </Text>
            </View>
          </View>

          {/* Current token card */}
          <View className="bg-mediq-lightest-grey rounded-2xl pt-6 pb-4 px-4 mx-2">
            <Text className="text-7xl font-bold align-baseline text-mediq-blue text-center">
              {currentToken?.queue_number}
            </Text>
            <Text className="text-sm font-bold text-mediq-blue text-center">
              Token Number
            </Text>

            {currentToken ? (
              <View>
                <View className="flex-row justify-between items-start mt-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm text-mediq-blue font-bold mb-0.5">
                      Name
                    </Text>
                    <Text className="text-base font-semibold text-mediq-text-black mb-2">
                      {currentToken.patient.name || "Unknown Patient"}
                    </Text>
                  </View>

                  <View className="flex-row space-x-6">
                    <View className="items-center mr-4">
                      <Text className="text-sm text-mediq-blue font-bold mb-0.5">
                        Age
                      </Text>
                      <Text className="text-base font-semibold text-mediq-text-black">
                        {currentToken.patient?.age || currentToken.patient_age || "N/A"}
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-sm text-mediq-blue font-bold mb-0.5">
                        Gender
                      </Text>
                      <Text className="text-base font-semibold text-mediq-text-black">
                        {currentToken.patient?.gender || currentToken.patient_gender || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
                {currentToken.patient.illness_note ? (
                  <>
                    <Text className="text-sm text-mediq-blue font-bold mb-0.5">
                      Illness
                    </Text>
                    <Text className="text-base font-normal text-mediq-text-black">
                      {currentToken.patient.illness_note}
                    </Text>
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
          <View className="flex-1 justify-end mt-4">
            <View className="flex-row justify-between">
              <Pressable
                onPress={togglePause}
              >
                {session.status === "active" ? (
                  <Image
                    source={MediQImages.queue_pause_icon}
                    className="w-28 h-28 mb-1"
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={MediQImages.queue_continue_icon}
                    className="w-28 h-28 mb-1"
                    resizeMode="contain"
                  />
                )}
              </Pressable>

              <Pressable
                onPress={() =>
                  Alert.alert("Mark Absent", "Mark this patient as absent?", [
                    { text: "No" },
                    { text: "Yes", onPress: markAbsent },
                  ])
                }
              >
                <Image
                  source={MediQImages.queue_absent_icon}
                  className="w-28 h-28 mb-1"
                  resizeMode="contain"
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  Alert.alert("Mark Served", "Mark this patient as served?", [
                    { text: "No" },
                    { text: "Yes", onPress: markServed },
                  ])
                }
              >
                <Image
                  source={MediQImages.queue_served_icon}
                  className="w-28 h-28 mb-1"
                  resizeMode="contain"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
