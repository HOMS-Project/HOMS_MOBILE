import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  View,
  Text,
  Pressable,
} from "react-native";
import KeyboardSafeArea from "../../components/KeyboardSafeArea";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import AuthHeader from "../../components/AuthHeader";
import OTPInput from "../../components/OTPInput";
import type { RootStackParamList } from "../../../App";
import { apiRequest, endpoints } from "../../api";

interface Props {
  onSubmit?: (code: string) => void;
  digits?: number;
}

const VerifyOTPScreen: React.FC<Props> = ({ onSubmit, digits = 6 }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "VerifyOTP">>();
  const email = (route.params as any)?.email || "";
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 40 }}
      >
          <Animated.View
            className="px-5 pb-8 pt-10"
            style={{ opacity: screenOpacity }}
          >
            <View className="items-center">
              <AuthHeader size={370} />
            </View>

            <Animated.View
              className="overflow-hidden rounded-[34px] border border-white/40 shadow-xl"
              style={{ transform: [{ scale: cardScale }] }}
            >
              <BlurView
                intensity={40}
                tint="systemUltraThinMaterial"
                className="absolute inset-0"
              />
              <View className="p-5" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <Text className="text-3xl font-black tracking-tight text-slate-900">
                  Xác thực OTP
                </Text>

                <Text className="mt-1 text-sm leading-5 text-slate-500">
                  Nhập mã OTP đã gửi đến email của bạn.
                </Text>
                {email ? (
                  <Text className="mt-1 text-sm font-semibold text-emerald-600">
                    {email}
                  </Text>
                ) : null}

                <View className="mt-7 rounded-2xl border border-white/40 bg-white/20 px-4 py-3">
                  <OTPInput
                    length={digits || 6}
                    onChange={setCode}
                    inputProps={{
                      style: {
                        width: 44,
                        height: 48,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.4)",
                        backgroundColor: "rgba(255,255,255,0.15)",
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#0f172a",
                      },
                    }}
                  />
                </View>

                <Animated.View
                  className="mt-6"
                  style={{ transform: [{ scale: buttonScale }] }}
                >
                  <Pressable
                    className={`h-[52px] items-center justify-center rounded-full bg-[#16A34A] ${submitting ? "opacity-70" : ""}`}
                    style={{
                      shadowColor: "#16A34A",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                    disabled={submitting}
                    onPressIn={() => animateButton(0.97)}
                    onPressOut={() => animateButton(1)}
                    onPress={async () => {
                      if (!email) {
                        navigation.goBack();
                        return;
                      }

                      if (onSubmit) {
                        onSubmit(code);
                        return;
                      }

                      setSubmitting(true);
                      try {
                        const res = await apiRequest(endpoints.auth.verifyOtp, {
                          method: "POST",
                          body: JSON.stringify({ email, otp: code }),
                        });

                        if (res?.success !== false) {
                          navigation.navigate("ResetPassword", { email });
                        }
                      } catch (err) {
                        // Consider showing toast/alert; silent fail for now
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-xl font-bold text-white">
                        Xác nhận
                      </Text>
                    )}
                  </Pressable>
                </Animated.View>

                <Pressable
                  className="mt-5 self-center"
                  onPress={() => navigation.navigate("ForgotPassword")}
                >
                  <Text className="text-sm font-semibold text-emerald-600">
                    Gửi lại mã
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
      </KeyboardSafeArea>
    </View>
  );
};

export default VerifyOTPScreen;
