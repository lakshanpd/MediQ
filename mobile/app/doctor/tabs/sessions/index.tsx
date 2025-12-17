import { useDoctor } from "@/contexts/doctorContext";
import { MediQImages } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, {useState} from "react";
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";


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
    const { doctorSessions, doctorTokens, doctorMetaData } = useDoctor();
    const router = useRouter();

    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // Sort and filter sessions by date (Upcoming first) safely
    const sortedSessions = [...(doctorSessions || [])]
        .filter(session => {
            const startDate = getDateFromValue(session.start_time);
            return (
                startDate.getMonth() === selectedMonth.getMonth() &&
                startDate.getFullYear() === selectedMonth.getFullYear()
            );
        })
        .sort((a, b) => {
            const aStart = getDateFromValue(a.start_time).getTime();
            const bStart = getDateFromValue(b.start_time).getTime();
            return aStart - bStart;
        });

    const upcomingSortedSessions = sortedSessions.filter(session => {
        const startMs = getMillisFromTimestamp(session.start_time);
        return startMs >= Date.now();
    });

    const renderSessionCard = ({ item }: { item: any }) => {
        const startDate = getDateFromValue(item.start_time);

        // Filter tokens for this specific session
        const sessionTokens = (doctorTokens || []).filter(
            (t: any) => t.session_id === item.id || t.sessionId === item.id
        );

        const pendingCount = sessionTokens.filter((t: any) => t.status === "pending").length;
        const acceptedCount = sessionTokens.filter((t: any) => t.status === "accepted").length;

        return (
            <View className={`bg-mediq-lightest-grey border-2 rounded-2xl p-4 mb-4 mt-4 relative ${item.status === "active"
              ? "border-mediq-green"
                : item.status === "paused"
                  ? "border-mediq-yellow"
                  : "border-mediq-blue"
            }`}>
                {/* Date and Time Row */}
                <View className="flex-row justify-between">
                    <Text className="text-2xl font-bold text-mediq-blue">
                        {formatSessionDate(startDate)}
                    </Text>
                    <Text className="text-base text-mediq-text-black font-semibold mt-4">
                        {formatSessionTimeRange(item.start_time, item.end_time)}
                    </Text>
                </View>

                {/* Location */}
                <Text className="text-lg font-medium text-mediq-light-blue mb-2">
                    {"Medihelp, Ratmalana"}
                    {/* {item.location || doctorMetaData?.hospital || "Medihelp, Ratmalana"} */}
                </Text>

                {/* Token Counts and Chevron */}
                <View className="flex-row items-center justify-between">
                    <View className="flex-row space-x-12">
                        <View className="items-center mr-3 ml-4">
                            <Text className="text-xl font-bold text-mediq-text-black">{acceptedCount}</Text>
                            <Text className="text-sm font-bold text-mediq-blue">Accepted</Text>
                        </View>
                        <View className="items-center ml-3">
                            <Text className="text-xl font-bold text-mediq-text-black">{pendingCount}</Text>
                            <Text className="text-sm font-bold text-mediq-blue">Requests</Text>
                        </View>
                    </View>

                    <Pressable
                        onPress={() => {
                            router.push({ pathname: "/doctor/tabs/sessions/[id]", params: { id: item.id } });
                        }}
                    >
                        <Ionicons name="chevron-forward" size={38} color="#9CA3AF" />
                    </Pressable>
                </View>
            </View>
        );
    };

    const onMonthChange = (event: any, date?: Date) => {
      setShowMonthPicker(false);
      if (date) {
          setSelectedMonth(date);
      }
  };


    // // determine current active session (now between start_time and end_time)
    // const nowMs = Date.now();
    // const currentSession = (doctorSessions ?? []).find((s: any) => {
    //   const startMs = getMillisFromTimestamp(s.start_time);
    //   const endMs = getMillisFromTimestamp(s.end_time);
    //   return startMs <= nowMs && nowMs <= endMs;
    // });
    // const currentSessionId = currentSession ? (currentSession.sessionId ?? currentSession.id) : null;

    // // show only accepted tokens that belong to the current session, sorted by created_at ascending (oldest first)
    // const acceptedTokens = (doctorTokens ?? []).filter((t: any) => {
    //   if (t.status !== "accepted") return false;
    //   const sid = t.session_id ?? t.sessionId ?? t.session;
    //   if (!currentSessionId) return false;
    //   return String(sid) === String(currentSessionId);
    // });
    // const acceptedTokensSorted = [...acceptedTokens].sort((a: any, b: any) => {
    //   return getMillisFromTimestamp(a.created_at) - getMillisFromTimestamp(b.created_at);
    // });

    return (
      <View className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <Image
          source={MediQImages.main_bg_top}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
          accessible={false}
        />
        <SafeAreaView className="flex-1">
          <View className="flex-row justify-between items-center pb-8">
            {/* Date Picker Placeholder */}
            <Pressable
              onPress={() => setShowMonthPicker(true)}
              className="flex-row items-center bg-white border border-gray-300 rounded-lg mt-14 ml-6 px-3 py-2 active:bg-gray-50"
            >
              <Ionicons name="calendar-outline" size={18} color="#333" />
              <Text className="ml-2 font-semibold text-mediq-text-black">
                {selectedMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
              </Text>
              <Ionicons
                name={showMonthPicker ? "chevron-up" : "chevron-down"}
                size={16}
                color="#333"
                className="ml-2"
              />
            </Pressable>

            <Pressable
              onPress={() => router.push("/doctor/tabs/sessions/add-session")}
              className="w-20 h-20  flex-row items-center justify-center mr-10 active:scale-95 "
            >
                        <Text className="text-2xl font-bold text-mediq-blue mr-2 mt-1">Add</Text>
              <Image
                source={MediQImages.session_add_icon}
                className="w-10 h-10"
              />
            </Pressable>
          </View>
        <View className="flex-row justify-center items-center">
          {showMonthPicker && (
            <DateTimePicker
              value={selectedMonth}
              mode="date"
              display="inline"
              onChange={onMonthChange}
              themeVariant="light"
              minimumDate={new Date()}
            />
          )}
          </View>

          {/* Sessions List */}
          <View className="flex-row">
            <FlatList
              data={sortedSessions}
              keyExtractor={(item) => item.id}
              renderItem={renderSessionCard}
              contentContainerStyle={{
                paddingHorizontal: 18,
                paddingBottom: 20,
              }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="items-center justify-center mt-20">
                  <Text className="text-gray-400">No sessions scheduled</Text>
                </View>
              }
            />
          </View>
        </SafeAreaView>
      </View>
    );
}