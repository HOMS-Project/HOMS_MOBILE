import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  PressableProps,
  ViewStyle,
  ActivityIndicator,
} from "react-native";
import { colors, spacing, radius } from "../theme";

interface Props extends PressableProps {
  title: string;
  fullWidth?: boolean;
  style?: ViewStyle;
  loading?: boolean;
}

const PrimaryButton: React.FC<Props> = ({
  title,
  fullWidth = true,
  style,
  disabled,
  loading = false,
  ...rest
}) => {
  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        disabled || loading ? styles.disabled : styles.enabled,
        pressed && !(disabled || loading) ? styles.pressed : null,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.buttonText} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  enabled: {
    backgroundColor: colors.primary,
  },
  disabled: {
    backgroundColor: colors.border,
  },
  pressed: {
    opacity: 0.92,
  },
  text: {
    color: colors.buttonText,
    fontWeight: "700",
    fontSize: 16,
  },
});

export default PrimaryButton;
