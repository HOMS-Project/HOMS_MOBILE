import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AuthHeader from "../../components/AuthHeader";
import OTPInput from "../../components/OTPInput";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import type { RootStackParamList } from "../../../App";
import { apiRequest, endpoints } from "../../api";

interface Props {
  onSubmit?: (code: string) => void;
  digits?: number;
}

const VerifyOTPScreen: React.FC<Props> = ({ onSubmit, digits = 4 }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "VerifyOTP">>();
  const email = (route.params as any)?.email || "";
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 pb-8 pt-12">
            <View className="items-center">
              <AuthHeader size={210} />
            </View>

            <Card className="rounded-[30px] p-6">
              <View className="mb-4 flex-row items-center gap-2">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color="#0f766e"
                />
                <Text className="text-3xl font-extrabold text-slate-900">
                  Xác thực OTP
                </Text>
              </View>

              <Text className="text-base text-slate-500">
                Nhập mã OTP đã gửi đến email của bạn.
              </Text>
              {email ? (
                <Text className="mt-1 text-sm font-semibold text-emerald-600">
                  {email}
                </Text>
              ) : null}

              <View className="mt-6">
                <OTPInput length={digits || 6} onChange={setCode} />
              </View>

              <Button
                title={submitting ? "Đang xác thực..." : "Xác nhận"}
                disabled={submitting}
                loading={submitting}
                className="mt-6 h-14"
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
              />

              <Pressable
                className="mt-5 self-center"
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Text className="text-sm font-semibold text-emerald-600">
                  Gửi lại mã
                </Text>
              </Pressable>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default VerifyOTPScreen;
