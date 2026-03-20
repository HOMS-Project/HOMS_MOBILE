import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AuthHeader from "../../components/AuthHeader";
import LabeledTextInput from "../../components/LabeledTextInput";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing } from "../../theme";
import type { RootStackParamList } from "../../../App";

import { apiRequest, endpoints, setAuthToken } from "../../api";

interface Props {
  onForgotPassword?: () => void;
  onSubmit?: (payload: { username: string; password: string }) => void;
}

const LoginScreen: React.FC<Props> = ({ onForgotPassword, onSubmit }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("nguyenvana123@example.com");
  const [password, setPassword] = useState("Password123@");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (onSubmit) {
      onSubmit({ email, password });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest(endpoints.auth.login, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (result.success && result.data.accessToken) {
        setAuthToken(result.data.accessToken);
        navigation.navigate("MainTabs");
      } else {
        setError(result.message || "Đăng nhập thất bại");
      }
    } catch (err: any) {
      setError(err.message || "Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Welcome Back!</Text>

            <View style={styles.spacerAfterSubtitle} />

            <LabeledTextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.spacerBetweenInputs} />

            <LabeledTextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secure
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.link}
              onPress={
                onForgotPassword ||
                (() => navigation.navigate("ForgotPassword"))
              }
            >
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              title={loading ? "Signing In..." : "Sign In"}
              onPress={handleSubmit}
              disabled={loading}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Sign In with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.googleButton}>
              <Text style={styles.googleText}>G</Text>
            </View>
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
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  spacerAfterSubtitle: {
    height: spacing.md,
  },
  spacerBetweenInputs: {
    height: spacing.sm,
  },
  link: {
    alignSelf: "flex-end",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  linkText: {
    color: colors.primary,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.muted,
    fontWeight: "500",
  },
  googleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FBFF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  googleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4285F4",
  },
  errorText: {
    color: "#E11D48",
    fontWeight: "700",
    marginTop: spacing.xs,
  },
});

export default LoginScreen;
