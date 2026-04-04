import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  className = "",
  textClassName = "",
}) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`h-12 items-center justify-center rounded-full bg-emerald-500 shadow-md ${isDisabled ? "opacity-60" : ""} ${className}`}
      disabled={isDisabled}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className={`text-lg font-bold text-white ${textClassName}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

export default Button;
