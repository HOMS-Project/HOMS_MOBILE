import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AuthHeader from "../../components/AuthHeader";
import LabeledTextInput from "../../components/LabeledTextInput";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing } from "../../theme";
import type { RootStackParamList } from "../../../App";

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
      const exists = onRequestOTP
        ? await onRequestOTP(trimmedEmail)
        : /\S+@\S+\.\S+/.test(trimmedEmail);

      if (exists) {
        navigation.navigate("VerifyOTP", { email: trimmedEmail });
      } else {
        setError("Email không tồn tại trong hệ thống");
      }
    } catch (err) {
      Alert.alert("Có lỗi xảy ra", "Vui lòng thử lại sau");
    } finally {
      setSubmitting(false);
    }
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
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Nhập Email để nhận mã xác thực (OTP)
            </Text>

            <View style={styles.spacerAfterSubtitle} />

            <LabeledTextInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              title={submitting ? "Sending..." : "Send OTP"}
              onPress={handleSendOTP}
              disabled={submitting}
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
  error: {
    color: "#E63946",
    marginBottom: spacing.sm,
    fontWeight: "600",
  },
});

export default ForgotPasswordScreen;
