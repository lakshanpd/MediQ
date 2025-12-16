import { useDoctor } from "@/contexts/doctorContext";
import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    StatusBar,
    Text,
    View,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper to parse dates
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
function formatTimeRange(start: any, end: any) {
    const s = getDateFromValue(start);
    const e = getDateFromValue(end);
    const fmt = (d: Date) =>
        d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    return `${fmt(s)} - ${fmt(e)}`;
}

export default function SessionDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Get session ID passed from previous screen
    const { doctorSessions, doctorTokens } = useDoctor();

    // State for the toggle switch (Tokens vs Requests)
    const [activeTab, setActiveTab] = useState<"tokens" | "requests">("tokens");
    const session = doctorSessions?.find((s) => s.id === id);

    if (!session) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text>Loading session...</Text>
            </View>
        );
    }

    // Filter tokens based on this session
    const allSessionTokens = (doctorTokens || []).filter(
        (t: any) => t.session_id === id || t.sessionId === id
    );

    // "Tokens" tab = Accepted status
    const acceptedTokens = allSessionTokens.filter((t: any) => t.status === "accepted");
    // For active/paused sessions, also show tokens currently in progress
    const activeSessionTokens = allSessionTokens.filter(
        (t: any) => t.status === "accepted" || t.status === "in_progress" || t.status === "served" || t.status === "absent"
    );

    // "Requests" tab = Pending status
    const pendingTokens = allSessionTokens.filter((t: any) => t.status === "pending");

    // Active/paused sessions only show Tokens
    const isSessionActive = session.status === "active" || session.status === "paused";

    const sortByQueueNumber = (a: any, b: any) => {
        const qa = Number(a.queue_number ?? 0);
        const qb = Number(b.queue_number ?? 0);
        return qa - qb;
    };

    const displayList = isSessionActive
        ? [...activeSessionTokens].sort(sortByQueueNumber)
        : activeTab === "tokens"
            ? [...acceptedTokens].sort(sortByQueueNumber)
            : [...pendingTokens].sort(sortByQueueNumber);

    // Handle Token Action (Cancel for accepted, Accept/Reject for pending)
    const handleTokenAction = async (tokenId: string, action: "cancel" | "accept" | "reject") => {
        try {
            const tokenRef = doc(db, "tokens", tokenId);
            let newStatus = "";

            if (action === "cancel") newStatus = "rejected";
            if (action === "accept") newStatus = "accepted";
            if (action === "reject") newStatus = "rejected";

            if (newStatus === "accepted") {
                await updateDoc(tokenRef, { status: newStatus, queue_number: acceptedTokens.length + 1 });
            }
            else {
                await updateDoc(tokenRef, { status: newStatus });
            }
        } catch (error) {
            Alert.alert("Error", "Could not update token status");
        }
    };

    // Handle Session Status Change
    const handleSessionStatus = async (newStatus: string) => {
        try {
            const sessionRef = doc(db, "sessions", session.id);
            await updateDoc(sessionRef, { status: newStatus });
            Alert.alert("Success", `Session marked as ${newStatus}`);
            if (newStatus === "completed" || newStatus === "cancelled") {
                router.back();
            }
        } catch (error) {
            Alert.alert("Error", "Could not update session");
        }
    };

    const renderPatientCard = ({ item, index }: { item: any; index: number }) => {
        // Calculate token number (index + 1 for display)
        const tokenNumber = (index + 1).toString().padStart(2, "0");

        return (
            <View className={`bg-mediq-lightest-grey rounded-2xl p-4 mb-4 mt-4 relative ${item.status === "in_progress" ? "border-mediq-blue border" : ""}`}>
                <View className="flex-row justify-between items-start mb-1">
                    <View>
                        <Text className="text-sm text-mediq-blue font-bold mb-0.5">
                            Name
                        </Text>
                        <Text className="text-base font-semibold text-mediq-text-black mb-2">
                            {item.patient.name || "Unknown Patient"}
                        </Text>
                    </View>
                    <Text className="text-2xl font-bold text-mediq-blue">
                        {item.queue_number}
                    </Text>
                </View>

                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="mr-4 items-center">
                            <Text className="text-sm text-mediq-blue font-bold mb-0.5">
                                Age
                            </Text>
                            <Text className="text-base font-semibold text-mediq-text-black">
                                {item.patient.age || "N/A"}
                            </Text>
                        </View>
                        <View className="mr-4 items-center">
                            <Text className="text-sm text-mediq-blue font-bold mb-0.5">
                                Gender
                            </Text>
                            <Text className="text-base font-semibold text-mediq-text-black">
                                {item.patient.gender || "N/A"}
                            </Text>
                        </View>
                        <View className="mr-4 items-center">
                            <Text className="text-sm text-mediq-blue font-bold mb-0.5">
                                Status
                            </Text>
                            <Text className="text-base font-semibold text-mediq-text-black">
                                {item.status || "N/A"}
                            </Text>
                        </View>
                    </View>
                    {/* Action Button */}
                    <View className="justify-end">
                        {activeTab === "tokens" ? null : (
                            <View className="flex-row space-x-2">
                                <Pressable
                                    onPress={() => handleTokenAction(item.id, "reject")}
                                    className="bg-mediq-red mr-3 px-4 py-2.5 rounded-xl active:opacity-80"
                                >
                                    <Text className="text-white text-sm font-bold">Reject</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => handleTokenAction(item.id, "accept")}
                                    className="bg-mediq-green px-4 py-2.5 rounded-xl active:opacity-80"
                                >
                                    <Text className="text-white text-sm font-bold">Accept</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };


    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-6 py-6">
                    {/* Absolute Back Button (pinned top-left) */}

                    <Pressable
                        onPress={() => router.back()}
                        className="w-16 h-16 rounded-2xl border border-slate-400 p-4 active:scale-95"
                    >
                        <Ionicons name={"chevron-back"} size={24} color="#6B7280" />
                    </Pressable>
                    <Text className="text-2xl font-bold text-mediq-text-black ml-6">
                        Session Details
                    </Text>
                </View>

                {/* Main Card Container */}
                <View className="flex-1 rounded-2xl border-mediq-light-blue border-2 p-4 mb-4 mx-4">
                    {/* Session Info Header */}
                    <View className="flex-row justify-between">
                        <Text className="text-2xl font-bold text-mediq-blue">
                            {formatHeaderDate(getDateFromValue(session.start_time))}
                        </Text>
                        <Text className="text-base text-mediq-text-black font-semibold mt-8">
                            {formatTimeRange(session.start_time, session.end_time)}
                        </Text>
                    </View>

                    {/* Location */}
                    <Text className="text-lg font-medium text-mediq-light-blue -mt-2 mb-2">
                        {"Medihelp, Ratmalana"}
                        {/* {item.location || doctorMetaData?.hospital || "Medihelp, Ratmalana"} */}
                    </Text>

                    {/* small line */}
                    <View className="border-b border-mediq-light-blue mb-1 mx-3" />

                    {/* Toggle Switcher (hidden while active/paused) */}
                    {!isSessionActive && (
                        <View className="flex-row mx-5 mt-4 mb-4 bg-white border border-gray-200 rounded-full">
                            <Pressable
                                className={`flex-1 py-2 rounded-full items-center flex-row justify-center space-x-2 ${activeTab === "tokens" ? "bg-gray-100" : "bg-transparent"
                                    }`}
                                onPress={() => setActiveTab("tokens")}
                            >
                                <View className="flex-row justify-start items-center ">
                                    <Text className="text-lg font-bold mr-2 text-mediq-text-black">
                                        {acceptedTokens.length}
                                    </Text>
                                    <Text className="text-lg font-bold text-mediq-blue">
                                        Tokens
                                    </Text>
                                </View>
                            </Pressable>

                            <Pressable
                                className={`flex-1 py-2 rounded-full items-center flex-row justify-center space-x-2 ${activeTab === "requests" ? "bg-gray-100" : "bg-transparent"
                                    }`}
                                onPress={() => setActiveTab("requests")}
                            >
                                <View className="flex-row justify-start items-center ">
                                    <Text className="text-lg font-bold mr-2 text-mediq-text-black">
                                        {pendingTokens.length}
                                    </Text>
                                    <Text className="text-lg font-bold text-mediq-blue">
                                        Requests
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    )}

                    {/* List */}
                    <FlatList
                        data={displayList}
                        keyExtractor={(item) => item.id}
                        renderItem={renderPatientCard}
                        contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 10 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-10">
                                <Text className="text-gray-400">No {isSessionActive ? "tokens" : activeTab} found</Text>
                            </View>
                        }
                    />

                    {/* Footer Actions */}
                    <View className="flex pt-6">
                        {/* small line */}
                        <View className="border-b border-mediq-light-blue mb-1 mx-3" />

                        <View className="flex-row py-4 justify-between">
                            {isSessionActive ? (
                                // Active Session Footer
                                <>
                                    <View className="flex mr-2">
                                        <Pressable
                                            className="bg-mediq-red rounded-xl px-6 py-3 items-center justify-center active:opacity-80"
                                            onPress={() =>
                                                Alert.alert("Cancel Session", "Are you sure?", [
                                                    { text: "No" },
                                                    {
                                                        text: "Yes",
                                                        onPress: () => handleSessionStatus("cancelled"),
                                                    },
                                                ])
                                            }
                                        >
                                            <Text className="text-white font-bold text-lg">Cancel</Text>
                                        </Pressable>
                                    </View>
                                    <View className="flex ml-2">

                                        <Pressable
                                            className="flex-[2] flex-row bg-mediq-blue rounded-xl px-12 py-3 items-center justify-center space-x-2 active:opacity-80"
                                            onPress={() => router.push({
                                                pathname: "/doctor/tabs/sessions/current-session",
                                                params: { id: session.id }
                                            })}
                                        >
                                            <Text className="text-white font-bold text-lg">Manage Queue</Text>
                                            <Ionicons name="arrow-forward" size={20} color="white" />
                                        </Pressable>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View className="flex ml-2">
                                        <Pressable
                                            className="flex-row bg-mediq-blue rounded-xl px-12 py-3 items-center justify-center space-x-2 active:opacity-80"
                                            onPress={() => {
                                                if (pendingTokens.length > 0) {
                                                    Alert.alert(
                                                        "Pending Requests",
                                                        "There are pending requests. Please process them before starting the session.",
                                                        [{ text: "OK" }]
                                                    );
                                                    return;
                                                }

                                                Alert.alert(
                                                    "Start Session",
                                                    "Are you sure you want to start this session?",
                                                    [
                                                        { text: "No" },
                                                        {
                                                            text: "Yes",
                                                            onPress: async () => {
                                                                await handleSessionStatus("active");
                                                                router.push({
                                                                    pathname: "/doctor/tabs/sessions/current-session",
                                                                    params: { id: session.id },
                                                                });
                                                            },
                                                        },
                                                    ]
                                                );
                                            }}
                                        >
                                            <Text className="text-white font-bold text-lg">Start</Text>
                                            <Ionicons name="arrow-forward" size={20} color="white" />
                                        </Pressable>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
