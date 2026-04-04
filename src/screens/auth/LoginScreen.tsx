import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import AuthHeader from "../../components/AuthHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import type { RootStackParamList } from "../../../App";

import { apiRequest, endpoints, setAuthToken } from "../../api";

interface Props {
  onForgotPassword?: () => void;
  onSubmit?: (payload: { email: string; password: string }) => void;
}

WebBrowser.maybeCompleteAuthSession();
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

const LoginScreen: React.FC<Props> = ({ onForgotPassword, onSubmit }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [googleRequest, googleResponse, promptGoogle] =
    Google.useIdTokenAuthRequest({
      clientId: GOOGLE_WEB_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      scopes: ["profile", "email"],
    });

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.params?.id_token;
      if (idToken) {
        handleGoogleLogin(idToken);
      } else {
        setError("Google không trả về token");
      }
    } else if (googleResponse?.type === "error") {
      setError("Đăng nhập Google thất bại");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  useEffect(() => {
    const loadLastEmail = async () => {
      try {
        const stored = await AsyncStorage.getItem("lastEmail");
        if (stored) setEmail(stored);
      } catch (err) {
        // ignore
      }
    };
    loadLastEmail();
  }, []);

  const handleSubmit = async () => {
    if (onSubmit) {
      onSubmit({ email, password });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest(endpoints.auth.login, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const userRole = result?.data?.user?.role;
      if (userRole !== "driver") {
        throw new Error("Chỉ tài xế (driver) mới được phép đăng nhập ứng dụng");
      }

      if (result.success && result.data.accessToken) {
        try {
          const userEmail = result?.data?.user?.email || email;
          if (userEmail) await AsyncStorage.setItem("lastEmail", userEmail);
        } catch (_) {}
        setAuthToken(result.data.accessToken);
        navigation.navigate("MainTabs");
      } else {
        setError(result.message || "Đăng nhập thất bại");
      }
    } catch (err: any) {
      setError(err.message || "Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    setGoogleLoading(true);
    setError(null);
    try {
      const result = await apiRequest(endpoints.auth.googleLogin, {
        method: "POST",
        body: JSON.stringify({ token: idToken }),
      });

      const userRole = result?.data?.user?.role;
      if (userRole !== "driver") {
        throw new Error("Chỉ tài xế (driver) mới được phép đăng nhập ứng dụng");
      }

      if (result.success && result.data.accessToken) {
        try {
          const userEmail = result?.data?.user?.email;
          if (userEmail) await AsyncStorage.setItem("lastEmail", userEmail);
        } catch (_) {}
        setAuthToken(result.data.accessToken);
        navigation.navigate("MainTabs");
      } else {
        setError(result.message || "Đăng nhập Google thất bại");
      }
    } catch (err: any) {
      setError(err.message || "Không thể kết nối đến máy chủ");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-100">
      <View className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-300/40" />
      <View className="absolute -left-20 bottom-12 h-56 w-56 rounded-full bg-sky-200/40" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pb-8 pt-12">
            <View className="items-center">
              <AuthHeader size={210} />
            </View>

            <Card className="rounded-[30px] p-6">
              <Text className="text-3xl font-extrabold text-slate-900">
                Đăng nhập
              </Text>
              <Text className="mt-2 text-base text-slate-500">
                Chào mừng bạn quay trở lại với HOMS Driver
              </Text>

              <View className="mt-6 gap-4">
                <Input
                  label="Email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />

                <Input
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                {error ? (
                  <Text className="text-sm font-semibold text-rose-500">
                    {error}
                  </Text>
                ) : null}

                <Pressable
                  className="self-end"
                  onPress={
                    onForgotPassword ||
                    (() => navigation.navigate("ForgotPassword"))
                  }
                >
                  <Text className="text-sm font-semibold text-emerald-600">
                    Quên mật khẩu?
                  </Text>
                </Pressable>

                <Button
                  title={loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  onPress={handleSubmit}
                  disabled={loading}
                  loading={loading}
                  className="mt-1 h-14"
                />
              </View>

              <View className="my-6 flex-row items-center gap-3">
                <View className="h-px flex-1 bg-slate-200" />
                <Text className="text-sm font-medium text-slate-400">
                  Đăng nhập với
                </Text>
                <View className="h-px flex-1 bg-slate-200" />
              </View>

              <Pressable
                className={`h-16 w-16 self-center items-center justify-center rounded-full bg-white shadow-lg ${googleLoading ? "opacity-60" : ""}`}
                disabled={!googleRequest || googleLoading}
                onPress={() => promptGoogle()}
              >
                {googleLoading ? (
                  <Text className="text-2xl font-semibold text-slate-400">
                    ...
                  </Text>
                ) : (
                  <Ionicons name="logo-google" size={26} color="#4285F4" />
                )}
              </Pressable>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
