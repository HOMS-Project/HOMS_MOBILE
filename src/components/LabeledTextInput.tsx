import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  TextInputProps,
} from "react-native";
import { colors, spacing, radius } from "../theme";

interface Props extends TextInputProps {
  label: string;
  secure?: boolean;
}

const LabeledTextInput: React.FC<Props> = ({
  label,
  secure,
  style,
  ...rest
}) => {
  const [hidden, setHidden] = useState<boolean>(!!secure);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.muted}
          secureTextEntry={hidden}
          {...rest}
        />
        {secure && (
          <Pressable
            onPress={() => setHidden((prev) => !prev)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{hidden ? "Hiển thị" : "Ẩn"}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: spacing.xs,
    fontSize: 15,
  },
  inputRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  toggle: {
    position: "absolute",
    right: spacing.sm,
    padding: spacing.xs,
  },
  toggleText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 13,
  },
});

export default LabeledTextInput;
