import { useUser } from "@/contexts/userContext";
import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { MediQImages } from "@/constants/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddSessionScreen() {
  const [sessionDate, setSessionDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const router = useRouter();
  const { userState } = useUser();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSubmit = async () => {
    try {
      // Combine date with start and end times
      const startDateTime = new Date(sessionDate);
      startDateTime.setHours(
        startTime.getHours(),
        startTime.getMinutes(),
        0,
        0
      );

      const endDateTime = new Date(sessionDate);
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        Alert.alert("Invalid Time", "End time must be after start time");
        return;
      }

      const sessionData = {
        created_at: Timestamp.now(),
        doctor_id: userState.userId,
        end_time: endDateTime.toISOString(),
        start_time: startDateTime.toISOString(),
        status: "scheduled",
        updated_at: Timestamp.now(),
      };

      await addDoc(collection(db, "sessions"), sessionData);

      Alert.alert("Success", "Session created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error creating session:", error);
      Alert.alert("Error", "Failed to create session. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 py-6">
          {/* Absolute Back Button (pinned top-left) */}

          <Pressable
            onPress={() => router.back()}
            className="w-16 h-16 rounded-2xl border border-slate-400 p-4 active:scale-95" // z-50 keeps it above other elements
          >
            <Ionicons name={"chevron-back"} size={24} color="#6B7280" />
          </Pressable>
          <Text className="text-2xl font-bold text-mediq-text-black ml-6">
            Add Session
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6  pt-8 pb-12">
            <View className="mb-6">
              {/* Session Date */}
              <Text className="text-lg font-semibold text-mediq-text-black mb-3">
                Session Date
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center bg-white border-2 border-mediq-light-grey rounded-2xl px-4 h-16"
              >
                <Ionicons name="calendar" size={24} color="#6B7280" />
                <Text className="flex-1 ml-3 text-lg text-mediq-text-black">
                  {formatDate(sessionDate)}
                </Text>
                <Ionicons
                  name={showDatePicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>

              {/* Date/Time Pickers */}
              {showDatePicker && (
                <DateTimePicker
                  value={sessionDate}
                  mode="date"
                  display="inline"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setSessionDate(selectedDate);
                  }}
                  minimumDate={new Date()}
                  themeVariant="light"
                />
              )}
            </View>
            <View className="mb-6">
              {/* Start Time */}
              <Text className="text-lg font-semibold text-mediq-text-black mb-3">
                Start Time
              </Text>
              <Pressable
                onPress={() => setShowStartTimePicker(true)}
                className="flex-row items-center bg-white border-2 border-mediq-light-grey rounded-2xl px-4 h-16"
              >
                <Ionicons name="time" size={24} color="#6B7280" />
                <Text className="flex-1 ml-3 text-lg text-mediq-text-black">
                  {formatTime(startTime)}
                </Text>
                <Ionicons
                  name={showStartTimePicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
              {showStartTimePicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="spinner"
                  themeVariant="light"
                  onChange={(event, selectedTime) => {
                    setShowStartTimePicker(false);
                    if (selectedTime) setStartTime(selectedTime);
                  }}
                />
              )}
            </View>
            <View className="mb-6">
              {/* End Time */}
              <Text className="text-lg font-semibold text-mediq-text-black mb-3">
                End Time
              </Text>
              <Pressable
                onPress={() => setShowEndTimePicker(true)}
                className="flex-row items-center bg-white border-2 border-mediq-light-grey rounded-2xl px-4 h-16"
              >
                <Ionicons name="time" size={24} color="#6B7280" />
                <Text className="flex-1 ml-3 text-lg text-mediq-text-black">
                  {formatTime(endTime)}
                </Text>
                <Ionicons
                  name={showDatePicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
              {showEndTimePicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="spinner"
                  themeVariant="light"
                  onChange={(event, selectedTime) => {
                    setShowEndTimePicker(false);
                    if (selectedTime) setEndTime(selectedTime);
                  }}
                />
              )}
            </View>
          </View>
        </ScrollView>

        <View className="px-6 pb-6 ">
          <Pressable
            onPress={handleSubmit}
            className="h-16 rounded-2xl bg-mediq-blue p-4 flex-row items-center justify-center active:scale-95"
          >
            <Text className="text-xl text-white font-bold">Create Session</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
