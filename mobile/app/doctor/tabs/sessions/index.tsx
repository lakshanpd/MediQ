import { useDoctor } from "@/contexts/doctorContext";
import { MediQImages } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";


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

    // Sort sessions by date (Upcoming first) safely
    const sortedSessions = [...(doctorSessions || [])].sort((a, b) => {
        return getDateFromValue(a.start_time).getTime() - getDateFromValue(b.start_time).getTime();
    });

    const upcomingSortedSessions = sortedSessions.filter(session => {
        const startMs = getMillisFromTimestamp(session.start_time);
        return startMs >= Date.now();
    });


    const renderSessionCard = ({ item }: { item: any }) => {
        const startDate = getDateFromValue(item.start_time);

        // Check if there's an active session if session:status = "active"
        const isSessionActive = item.status === "active";

        // Filter tokens for this specific session
        const sessionTokens = (doctorTokens || []).filter(
            (t: any) => t.session_id === item.id || t.sessionId === item.id
        );

        const pendingCount = sessionTokens.filter((t: any) => t.status === "pending").length;
        const acceptedCount = sessionTokens.filter((t: any) => t.status === "accepted").length;

        return (
            <View className={'bg-mediq-lightest-grey rounded-2xl p-4 mb-4 mt-4 relative ' +
                (isSessionActive ? 'border-2 border-green-400' : '')}
            >

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
                            // Navigate to details if needed, or expand
                            console.log("View session details", item.id);
                        }}
                    >
                        <Ionicons name="chevron-forward" size={38} color="#9CA3AF" />
                    </Pressable>
                </View>
            </View>
        );
    };

    const currentMonthYear = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
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
            <SafeAreaView className="flex-1">
                <View className="flex-row justify-between items-center pb-8">
                    {/* TODO: Implement month Picker */}
                    {/* Date Picker Placeholder */}
                    <View className="flex-row items-center bg-white border border-gray-300 rounded-lg mt-14 ml-6 px-3 py-2">
                        <Ionicons name="calendar-outline" size={18} color="#333" />
                        <Text className="ml-2 font-semibold text-mediq-text-black">
                            {currentMonthYear}
                        </Text>
                        <Ionicons
                            name="chevron-down"
                            size={16}
                            color="#333"
                            className="ml-2"
                        />
                    </View>

                    <Pressable
                        onPress={() => router.push("/doctor/tabs/sessions/add-session")}
                        className="w-20 h-20  flex items-center justify-center active:scale-95 "
                    >
                        <Image
                            source={MediQImages.session_add_icon}
                            className="w-10 h-10 mr-5 mt-3"
                        />
                    </Pressable>
                </View>

                {/* Sessions List */}
                <View className="flex-row">
                    <FlatList
                        data={upcomingSortedSessions}
                        keyExtractor={(item) => item.id}
                        renderItem={renderSessionCard}
                        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 20 }}
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