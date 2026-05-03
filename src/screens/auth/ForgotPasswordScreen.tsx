import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  View,
  Text,
  TextInput,
  Alert,
  Pressable,
} from "react-native";
import KeyboardSafeArea from "../../components/KeyboardSafeArea";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import AuthHeader from "../../components/AuthHeader";
import type { RootStackParamList } from "../../../App";
import { apiRequest, endpoints } from "../../api";

interface Props {
  onRequestOTP?: (email: string) => Promise<boolean> | boolean;
}

type FormFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
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
  keyboardType,
  autoCapitalize,
  autoCorrect,
}) => {
  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-bold text-slate-700">{label}</Text>
      <View className="h-[48px] flex-row items-center rounded-xl border border-emerald-100 bg-white/95 px-4">
        <Ionicons name={icon} size={18} color="#4b5563" />
        <TextInput
          className="ml-3 flex-1 text-[15px] text-slate-900"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
      </View>
    </View>
  );
};

const ForgotPasswordScreen: React.FC<Props> = ({ onRequestOTP }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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

  const handleSendOTP = async () => {
    const trimmedEmail = email.trim();
    setError(null);

    if (!trimmedEmail) {
      setError("Vui lòng nhập Email");
      return;
    }

    setSubmitting(true);
    try {
      if (onRequestOTP) {
        const ok = await onRequestOTP(trimmedEmail);
        if (ok) navigation.navigate("VerifyOTP", { email: trimmedEmail });
        else setError("Email không tồn tại trong hệ thống");
      } else {
        const res = await apiRequest(endpoints.auth.forgotPassword, {
          method: "POST",
          body: JSON.stringify({ email: trimmedEmail }),
        });

        if (res?.success !== false) {
          navigation.navigate("VerifyOTP", { email: trimmedEmail });
        } else {
          setError(res?.message || "Gửi OTP thất bại");
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Vui lòng thử lại sau";
      setError(msg);
    } finally {
      setSubmitting(false);
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
              className="overflow-hidden rounded-[28px] border border-white/70 bg-white/30 shadow-xl"
              style={{ transform: [{ scale: cardScale }] }}
            >
              <BlurView
                intensity={26}
                tint="light"
                className="absolute inset-0"
              />
              <View className="p-5">
                <Text className="text-[24px] font-black tracking-tight text-slate-900">
                  Quên mật khẩu
                </Text>

                <Text className="mt-1 text-[13px] leading-5 text-slate-500">
                  Nhập email để nhận mã OTP và khôi phục tài khoản an toàn.
                </Text>

                <View className="mt-5 gap-4">
                  <FormField
                    label="Email"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    icon="mail-outline"
                  />

                  {error ? (
                    <Text className="text-xs font-semibold text-rose-500">
                      {error}
                    </Text>
                  ) : null}

                  <Animated.View
                    className="mt-1"
                    style={{ transform: [{ scale: buttonScale }] }}
                  >
                    <Pressable
                      className={`h-[52px] items-center justify-center rounded-full bg-[#16A34A] ${submitting ? "opacity-70" : ""}`}
                      style={{
                        shadowColor: "#16A34A",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 5,
                      }}
                      onPress={handleSendOTP}
                      disabled={submitting}
                      onPressIn={() => animateButton(0.97)}
                      onPressOut={() => animateButton(1)}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-base font-bold text-white">
                          Gửi mã OTP
                        </Text>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>

                <Pressable
                  className="mt-4 self-center"
                  onPress={() => navigation.navigate("Login")}
                >
                  <Text className="text-[13px] font-semibold text-emerald-600">
                    Quay lại đăng nhập
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
      </KeyboardSafeArea>
    </View>
  );
};

export default ForgotPasswordScreen;
