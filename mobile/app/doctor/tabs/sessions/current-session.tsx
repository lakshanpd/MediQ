import React from "react";
import { View, Text, StatusBar, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function CurrentSessionScreen() {
    const router = useRouter();
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
                        <Ionicons name={"chevron-back"} size={24} color="#6B7280" />
                    </Pressable>
                    <Text className="text-2xl font-bold text-mediq-text-black ml-6">
                        Current Session
                    </Text>
                </View>

                {/* Body */}
                <View className="flex-1 items-center justify-center">
                    <Text className="text-2xl font-bold text-mediq-blue">This is current session</Text>
                </View>
            </SafeAreaView>
        </View>
    );
}
