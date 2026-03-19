import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import AuthHeader from "../../components/AuthHeader";
import LabeledTextInput from "../../components/LabeledTextInput";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing } from "../../theme";

interface Props {
  onSubmit?: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

const ChangePasswordScreen: React.FC<Props> = ({ onSubmit }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = () => {
    onSubmit?.({ currentPassword, newPassword, confirmPassword });
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
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.lead}>
              Create a new password. Ensure it differs from the previous one for
              security.
            </Text>

            <View style={styles.spacerAfterLead} />

            <LabeledTextInput
              label="Enter Current Password"
              placeholder="@#%"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secure
            />

            <View style={styles.spacerBetweenInputs} />

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

            <PrimaryButton title="Update" onPress={handleSubmit} />
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
