import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AuthHeader from "../../components/AuthHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import type { RootStackParamList } from "../../../App";
import { apiRequest, endpoints } from "../../api";

interface Props {
  onRequestOTP?: (email: string) => Promise<boolean> | boolean;
}

const ForgotPasswordScreen: React.FC<Props> = ({ onRequestOTP }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      Alert.alert("Có lỗi xảy ra", "Vui lòng thử lại sau");
    } finally {
      setSubmitting(false);
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 pb-8 pt-12">
            <View className="items-center">
              <AuthHeader size={210} />
            </View>

            <Card className="rounded-[30px] p-6">
              <View className="mb-4 flex-row items-center gap-2">
                <Ionicons name="mail-open-outline" size={22} color="#0f766e" />
                <Text className="text-3xl font-extrabold text-slate-900">
                  Quên mật khẩu
                </Text>
              </View>

              <Text className="text-base text-slate-500">
                Nhập email để nhận mã OTP và khôi phục tài khoản an toàn.
              </Text>

              <View className="mt-6 gap-4">
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {error ? (
                  <Text className="text-sm font-semibold text-rose-500">
                    {error}
                  </Text>
                ) : null}

                <Button
                  title={submitting ? "Đang gửi..." : "Gửi mã OTP"}
                  onPress={handleSendOTP}
                  disabled={submitting}
                  loading={submitting}
                  className="mt-1 h-14"
                />
              </View>

              <Pressable
                className="mt-5 self-center"
                onPress={() => navigation.navigate("Login")}
              >
                <Text className="text-sm font-semibold text-emerald-600">
                  Quay lại đăng nhập
                </Text>
              </Pressable>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPasswordScreen;
