import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AuthHeader from "../../components/AuthHeader";
import LabeledTextInput from "../../components/LabeledTextInput";
import PrimaryButton from "../../components/PrimaryButton";
import { colors, spacing } from "../../theme";
import type { RootStackParamList } from "../../../App";

interface Props {
  onSubmit?: (payload: {
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

const ResetPasswordScreen: React.FC<Props> = ({ onSubmit }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
              title="Send"
              onPress={() => {
                if (onSubmit) {
                  onSubmit({ newPassword, confirmPassword });
                } else {
                  navigation.navigate("Login");
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
