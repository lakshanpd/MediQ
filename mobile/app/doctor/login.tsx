import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import React, { use, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Image,
  Pressable,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import { MediQImages } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useUser } from "@/contexts/userContext";
import { getExpoPushToken } from "@/utils/getExpoPushToken";
import { collection, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";


export default function DoctorLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setUserRole } = useUser();

const handleLogin = async () => {
  try {
    // 1. Sign in
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = userCredential.user.uid;

    // 2. Get Expo push token
    const device_token = await getExpoPushToken();
    if (!device_token) return;

    // 3. Query doctor by uid field
    const q = query(
      collection(db, "doctors"),
      where("uid", "==", uid)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn("No doctor document found for UID:", uid);
      return;
    }

    // 4. Update matched doctor document
    const doctorDocRef = snap.docs[0].ref;

    await updateDoc(doctorDocRef, {
      device_token,
      updated_at: serverTimestamp(),
    });
  } catch (err) {
    console.error("Login or update failed:", err);
  }
};
   

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
        {/* Top-level container so absolute-positioned BackButton overlays content */}
        <View className="flex-row justify-start items-center absolute top-24 left-8 ">
          {/* Absolute Back Button (pinned top-left) */}

          <Pressable
            onPress={() => { router.back(); setUserRole(null); }}
            className="w-16 h-16 rounded-2xl border border-slate-400 p-4 active:scale-95" // z-50 keeps it above other elements
          >
            <Ionicons
              name={"chevron-back"}
              size={24}
              color="#6B7280"
            />
          </Pressable>
          <Text className="text-2xl font-bold text-mediq-text-black ml-6">
            Doctor Login
          </Text>
        </View>

        <View className="items-center px-6 mt-16">
          <Image
            source={MediQImages.mediq_inline_logo}
            className="w-56 h-32 mt-16 "
            resizeMode="contain"
          />
        </View>

        <View className="px-6 mt-12">
          {/* Email Address */}
          <Text className="text-lg font-semibold text-mediq-text-black mb-3">
            Email Address
          </Text>
          <View className="flex-row items-center bg-white border-2 border-mediq-light-grey rounded-2xl px-4 mb-8 h-16">
            <Ionicons name="mail" size={24} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-lg text-mediq-text-black"
              placeholder="elementary221b@gmail.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <Text className="text-lg font-semibold text-mediq-text-black mb-3">
            Password
          </Text>
          <View className="flex-row items-center bg-white border-2 border-mediq-light-grey rounded-2xl px-4 mb-8 h-16">
            <Ionicons name="lock-closed" size={24} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-lg text-mediq-text-black"
              placeholder="••••••••••••••••"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="p-2"
            >
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={24}
                color="#9CA3AF"
              />
            </Pressable>
          </View>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            className="h-16 rounded-2xl bg-mediq-blue flex-row items-center justify-center active:scale-95 mb-6"
          >
            <Text className="text-xl text-white font-bold">
              Login
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  label: { fontSize: 13, color: "#666", marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 18,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
