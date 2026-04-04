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
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AuthHeader from "../../components/AuthHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import type { RootStackParamList } from "../../../App";
import { apiRequest, endpoints } from "../../api";

interface Props {
  onSubmit?: (payload: {
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

const ResetPasswordScreen: React.FC<Props> = ({ onSubmit }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ResetPassword">>();
  const email = (route.params as any)?.email || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
                <Ionicons name="key-outline" size={22} color="#0f766e" />
                <Text className="text-3xl font-extrabold text-slate-900">
                  Mật khẩu mới
                </Text>
              </View>

              <Text className="text-base text-slate-500">
                Tạo mật khẩu mới để bảo vệ tài khoản của bạn.
              </Text>

              <View className="mt-6 gap-4">
                <Input
                  label="Nhập mật khẩu mới"
                  placeholder="@#%"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <Input
                  label="Xác nhận mật khẩu"
                  placeholder="@#%"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <Button
                  title={loading ? "Đang xử lý..." : "Xác nhận"}
                  disabled={loading}
                  loading={loading}
                  className="mt-1 h-14"
                  onPress={async () => {
                    if (onSubmit) {
                      onSubmit({ newPassword, confirmPassword });
                      return;
                    }

                    if (!email) {
                      Alert.alert(
                        "Thiếu email",
                        "Vui lòng quay lại và nhập email",
                      );
                      navigation.goBack();
                      return;
                    }
                    if (!newPassword || newPassword !== confirmPassword) {
                      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
                      return;
                    }

                    setLoading(true);
                    try {
                      const res = await apiRequest(
                        endpoints.auth.resetPassword,
                        {
                          method: "POST",
                          body: JSON.stringify({ email, newPassword }),
                        },
                      );

                      if (res?.success !== false) {
                        Alert.alert(
                          "Thành công",
                          "Đặt lại mật khẩu thành công",
                          [
                            {
                              text: "OK",
                              onPress: () => navigation.navigate("Login"),
                            },
                          ],
                        );
                      } else {
                        Alert.alert(
                          "Lỗi",
                          res?.message || "Không đặt lại được mật khẩu",
                        );
                      }
                    } catch (err: any) {
                      Alert.alert(
                        "Lỗi",
                        err?.message || "Không thể kết nối máy chủ",
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
              </View>

              <Pressable
                className="mt-5 self-center"
                onPress={() => navigation.goBack()}
              >
                <Text className="text-sm font-semibold text-emerald-600">
                  Quay lại
                </Text>
              </Pressable>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ResetPasswordScreen;
