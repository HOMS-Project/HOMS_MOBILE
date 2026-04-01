import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AuthHeader from "../../components/AuthHeader";
import LabeledTextInput from "../../components/LabeledTextInput";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing } from "../../theme";
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

  const handleSubmit = () => {
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
    apiRequest(endpoints.user.changePassword, {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
      .then((res) => {
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
      })
      .catch((err: any) => {
        Alert.alert("Lỗi", err?.message || "Không thể kết nối máy chủ");
      })
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stack}>
          <View style={styles.logoWrap}>
            <AuthHeader size={333} />
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Đổi mật khẩu</Text>
            <Text style={styles.lead}>
              Tạo mật khẩu mới. Hãy đảm bảo mật khẩu mới khác với mật khẩu cũ để tăng cường bảo mật.
            </Text>

            <View style={styles.spacerAfterLead} />

            <LabeledTextInput
              label="Nhập mật khẩu hiện tại"
              placeholder="@#%"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secure
            />

            <View style={styles.spacerBetweenInputs} />

            <LabeledTextInput
              label="Nhập mật khẩu mới"
              placeholder="@#%"
              value={newPassword}
              onChangeText={setNewPassword}
              secure
            />

            <View style={styles.spacerBetweenInputs} />

            <LabeledTextInput
              label="Xác nhận mật khẩu mới"
              placeholder="@#%"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
            />

            <PrimaryButton
              title={loading ? "Đang cập nhật..." : "Cập nhật"}
              onPress={handleSubmit}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  stack: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    justifyContent: "center",
    transform: [{ translateY: -14 }],
  },
  logoWrap: {
    marginBottom: -spacing.sm,
    transform: [{ translateY: -2 }],
  },
  form: {
    width: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  lead: {
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  spacerAfterLead: {
    height: spacing.sm,
  },
  spacerBetweenInputs: {
    height: spacing.xs,
  },
});

export default ChangePasswordScreen;
