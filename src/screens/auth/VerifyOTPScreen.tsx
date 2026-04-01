import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AuthHeader from "../../components/AuthHeader";
import OTPInput from "../../components/OTPInput";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing } from "../../theme";
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
            <Text style={styles.title}>Xác thực</Text>
            <Text style={styles.subtitle}>Nhập mã xác thực của bạn</Text>

            <View style={styles.spacerAfterSubtitle} />

            <OTPInput length={6} onChange={setCode} />

            <PrimaryButton
              title={submitting ? "Đang xác thực..." : "Xác nhận"}
              disabled={submitting}
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
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  spacerAfterSubtitle: {
    height: spacing.sm,
  },
});

export default VerifyOTPScreen;
