import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  PressableProps,
  ViewStyle,
} from "react-native";
import { colors, spacing, radius } from "../theme";

interface Props extends PressableProps {
  title: string;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const PrimaryButton: React.FC<Props> = ({
  title,
  fullWidth = true,
  style,
  disabled,
  ...rest
}) => {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        disabled ? styles.disabled : styles.enabled,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
      {...rest}
    >
      <Text style={styles.text}>{title}</Text>
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
