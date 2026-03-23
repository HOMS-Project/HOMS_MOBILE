import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AuthHeader from "../../components/AuthHeader";
import LabeledTextInput from "../../components/LabeledTextInput";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing } from "../../theme";
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
            <Text style={styles.title}>New Password</Text>

            <View style={styles.spacerAfterTitle} />

            <LabeledTextInput
              label="Enter New Password"
              placeholder="@#%"
              value={newPassword}
              onChangeText={setNewPassword}
              secure
            />

            <View style={styles.spacerBetweenInputs} />

            <LabeledTextInput
              label="Confirm Password"
              placeholder="@#%"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
            />

            <PrimaryButton
              title={loading ? "Processing..." : "Send"}
              disabled={loading}
              onPress={async () => {
                if (onSubmit) {
                  onSubmit({ newPassword, confirmPassword });
                  return;
                }

                if (!email) {
                  Alert.alert("Thiếu email", "Vui lòng quay lại và nhập email");
                  navigation.goBack();
                  return;
                }
                if (!newPassword || newPassword !== confirmPassword) {
                  Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
                  return;
                }

                setLoading(true);
                try {
                  const res = await apiRequest(endpoints.auth.resetPassword, {
                    method: "POST",
                    body: JSON.stringify({ email, newPassword }),
                  });

                  if (res?.success !== false) {
                    Alert.alert("Thành công", "Đặt lại mật khẩu thành công", [
                      {
                        text: "OK",
                        onPress: () => navigation.navigate("Login"),
                      },
                    ]);
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
    transform: [{ translateY: -12 }],
  },
  logoWrap: {
    marginBottom: -spacing.sm,
    transform: [{ translateY: -2 }],
  },
  form: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  spacerAfterTitle: {
    height: spacing.sm,
  },
  spacerBetweenInputs: {
    height: spacing.sm,
  },
});

export default ResetPasswordScreen;
