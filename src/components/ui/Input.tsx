import React from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  className?: string;
};

const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  ...props
}) => {
  return (
    <View className="gap-2">
      {label ? (
        <Text className="text-sm font-semibold text-slate-700">{label}</Text>
      ) : null}
      <TextInput
        className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 ${className}`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error ? (
        <Text className="text-sm font-medium text-rose-500">{error}</Text>
      ) : null}
    </View>
  );
};

export default Input;
