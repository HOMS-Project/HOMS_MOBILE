import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { colors, spacing, radius } from "../theme";

interface Props {
  length?: number;
  onChange?: (code: string) => void;
  inputProps?: TextInputProps;
  autoFocus?: boolean;
}

const OTPInput: React.FC<Props> = ({
  length = 4,
  onChange,
  inputProps,
  autoFocus = true,
}) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => {
      refs.current[0]?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [autoFocus, length]);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, "");
    const next = [...values];

    if (cleaned.length > 1) {
      // Handle paste: spread characters across remaining inputs
      let cursor = index;
      for (const char of cleaned) {
        if (cursor >= length) break;
        next[cursor] = char;
        cursor += 1;
      }
      setValues(next);
      onChange?.(next.join(""));
      const focusIndex = Math.min(index + cleaned.length, length - 1);
      refs.current[focusIndex]?.focus();
      return;
    }

    const char = cleaned.slice(-1);
    next[index] = char;
    setValues(next);
    onChange?.(next.join(""));

    if (char && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (event.nativeEvent.key === "Backspace" && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {values.map((val, idx) => (
        <TextInput
          key={idx}
          ref={(ref) => {
            refs.current[idx] = ref;
          }}
          value={val}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={1}
          onChangeText={(text) => handleChange(text, idx)}
          onKeyPress={(event) => handleKeyPress(event, idx)}
          textAlign="center"
          {...inputProps}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    fontSize: 18,
    color: colors.text,
  },
});

export default OTPInput;
