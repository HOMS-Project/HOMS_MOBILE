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
import { apiRequest, endpoints } from "../../api";
import type { RootStackParamList } from "../../../App";

interface Props {
  onSubmit?: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

const ChangePasswordScreen: React.FC<Props> = ({ onSubmit }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (onSubmit) {
      onSubmit({ currentPassword, newPassword, confirmPassword });
      return;
    }

    if (!currentPassword || !newPassword) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ mật khẩu");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Không khớp", "Mật khẩu xác nhận không trùng");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest(endpoints.user.changePassword, {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res?.success !== false) {
        Alert.alert("Thành công", "Đổi mật khẩu thành công", [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate("MainTabs", { screen: "Settings" } as any),
          },
        ]);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Lỗi", res?.message || "Không đổi được mật khẩu");
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err?.message || "Không thể kết nối máy chủ");
    } finally {
      setLoading(false);
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
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="#0f766e"
                />
                <Text className="text-3xl font-extrabold text-slate-900">
                  Đổi mật khẩu
                </Text>
              </View>

              <Text className="text-base text-slate-500">
                Tạo mật khẩu mới và đảm bảo khác với mật khẩu cũ.
              </Text>

              <View className="mt-6 gap-4">
                <Input
                  label="Nhập mật khẩu hiện tại"
                  placeholder="@#%"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />

                <Input
                  label="Nhập mật khẩu mới"
                  placeholder="@#%"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <Input
                  label="Xác nhận mật khẩu mới"
                  placeholder="@#%"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <Button
                  title={loading ? "Đang cập nhật..." : "Cập nhật"}
                  onPress={handleSubmit}
                  disabled={loading}
                  loading={loading}
                  className="mt-1 h-14"
                />
              </View>

              <Pressable
                className="mt-5 self-center"
                onPress={() => navigation.goBack()}
              >
                <Text className="text-sm font-semibold text-emerald-600">
                  Quay lại cài đặt
                </Text>
              </Pressable>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChangePasswordScreen;
