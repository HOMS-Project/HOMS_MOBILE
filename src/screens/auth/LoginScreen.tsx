import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import KeyboardSafeArea from "../../components/KeyboardSafeArea";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AuthHeader from "../../components/AuthHeader";
import type { RootStackParamList } from "../../../App";

import { apiRequest, endpoints, setAuthToken, setRefreshToken } from "../../api";

interface Props {
  onForgotPassword?: () => void;
  onSubmit?: (payload: { email: string; password: string }) => void;
}

type FormFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: React.ComponentProps<typeof TextInput>["autoCapitalize"];
  autoCorrect?: boolean;
};

const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  autoCorrect,
}) => {
  const [hidden, setHidden] = React.useState(true);
  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-bold text-slate-700">{label}</Text>
      <View className="h-[48px] flex-row items-center rounded-xl border border-white/40 bg-white/30 px-4">
        <Ionicons name={icon} size={18} color="#4b5563" />
        <TextInput
          className="ml-3 flex-1 text-[15px] text-slate-900"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={12}>
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#94a3b8"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};


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
  const [rememberMe, setRememberMe] = useState(true);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem("lastEmail");
        if (stored) setEmail(stored);
        const storedRememberId = await AsyncStorage.getItem("rememberMe");
        if (storedRememberId !== null) {
          setRememberMe(storedRememberId === "true");
        }
      } catch (err) {
        // ignore
      }
    };
    loadPreferences();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 4,
      }),
    ]).start();
  }, [cardScale, screenOpacity]);

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
          if (userEmail) {
            await AsyncStorage.setItem("lastEmail", userEmail);
          }
          await AsyncStorage.setItem("rememberMe", rememberMe.toString());
        } catch (_) {}
        await setAuthToken(result.data.accessToken, rememberMe);
        // Save refresh token (7-day) to enable auto-silent-refresh
        if (result.data.refreshToken) {
          await setRefreshToken(result.data.refreshToken);
        }
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
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
        await setAuthToken(result.data.accessToken);
        if (result.data.refreshToken) {
          await setRefreshToken(result.data.refreshToken);
        }
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } else {
        setError(result.message || "Đăng nhập Google thất bại");
      }
    } catch (err: any) {
      setError(err.message || "Không thể kết nối đến máy chủ");
    } finally {
      setGoogleLoading(false);
    }
  };

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  return (
    <View className="flex-1 bg-[#edf4ef]">
      <LinearGradient
        colors={["#e7f4ea", "#f5faf6", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      <View className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/30" />
      <View className="absolute left-[-80px] top-[36%] h-64 w-64 rounded-full bg-cyan-100/35" />
      <View className="absolute -bottom-24 -left-14 h-72 w-72 rounded-full bg-emerald-100/45" />

      <KeyboardSafeArea
        scrollable
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 24 }}
      >
          <Animated.View
            className="px-5 pb-4 pt-6"
            style={{ opacity: screenOpacity }}
          >
            <View className="items-center">
              <AuthHeader size={200} />
            </View>

            <Animated.View
              className="overflow-hidden rounded-[28px] border border-white/40 shadow-xl"
              style={{ transform: [{ scale: cardScale }] }}
            >
              <BlurView
                intensity={40}
                tint="systemUltraThinMaterial"
                className="absolute inset-0"
              />
              <View className="p-5" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <Text className="text-[26px] font-black tracking-tight text-slate-900">
                  Đăng nhập
                </Text>
                <Text className="mt-1 text-[13px] leading-5 text-slate-600">
                  Chào mừng bạn quay trở lại với HOMS Driver
                </Text>

                <View className="mt-5 gap-4">
                  <FormField
                    label="Email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChangeText={setEmail}
                    icon="mail-outline"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />

                  <FormField
                    label="Mật khẩu"
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChangeText={setPassword}
                    icon="lock-closed-outline"
                    secureTextEntry
                  />

                  {error ? (
                    <Text className="text-xs font-semibold text-rose-500">
                      {error}
                    </Text>
                  ) : null}

                  <View className="flex-row items-center justify-between">
                    <Pressable
                      className="flex-row items-center gap-2"
                      onPress={() => setRememberMe(!rememberMe)}
                    >
                      <View
                        className={`h-[18px] w-[18px] items-center justify-center rounded-[5px] border ${
                          rememberMe
                            ? "border-[#16A34A] bg-[#16A34A]"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {rememberMe && (
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        )}
                      </View>
                      <Text className="text-[13px] font-medium text-slate-700">
                        Ghi nhớ đăng nhập
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={
                        onForgotPassword ||
                        (() => navigation.navigate("ForgotPassword"))
                      }
                    >
                      <Text className="text-[13px] font-semibold text-[#16A34A]">
                        Quên mật khẩu?
                      </Text>
                    </Pressable>
                  </View>

                  <Animated.View
                    className="mt-1"
                    style={{ transform: [{ scale: buttonScale }] }}
                  >
                    <Pressable
                      className={`h-[52px] items-center justify-center rounded-full bg-[#16A34A] ${loading ? "opacity-70" : ""}`}
                      style={{
                        shadowColor: "#16A34A",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 5,
                      }}
                      onPress={handleSubmit}
                      disabled={loading}
                      onPressIn={() => animateButton(0.97)}
                      onPressOut={() => animateButton(1)}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-base font-bold text-white">
                          Đăng nhập
                        </Text>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
      </KeyboardSafeArea>
    </View>
  );
};

export default LoginScreen;
