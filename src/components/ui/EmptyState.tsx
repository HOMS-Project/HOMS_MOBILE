import React from "react";
import { View, Text, ViewProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "./Card";

interface EmptyStateProps extends ViewProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = "document-text-outline",
  className,
  ...props
}) => {
  return (
    <View
      className={`items-center justify-center py-12 px-6 ${className}`}
      {...props}
    >
      <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-100/50">
          <Ionicons name={icon} size={38} color="#059669" />
        </View>
      </View>
      <Text className="text-center text-xl font-bold text-slate-900">
        {title}
      </Text>
      {description ? (
        <Text className="mt-2 text-center text-base leading-6 text-slate-500">
          {description}
        </Text>
      ) : null}
    </View>
  );
};

export default EmptyState;
