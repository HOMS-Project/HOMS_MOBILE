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
    <View className="gap-2.5">
      {label ? (
        <Text className="text-base font-bold text-slate-700">{label}</Text>
      ) : null}
      <TextInput
        className={`h-[68px] rounded-xl border border-emerald-100 bg-white px-5 text-lg text-slate-900 ${className}`}
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
