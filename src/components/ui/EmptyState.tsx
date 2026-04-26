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
      className={`items-center justify-center py-8 px-5 ${className}`}
      {...props}
    >
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-emerald-100/50">
          <Ionicons name={icon} size={28} color="#059669" />
        </View>
      </View>
      <Text className="text-center text-lg font-bold text-slate-900">
        {title}
      </Text>
      {description ? (
        <Text className="mt-1.5 text-center text-sm leading-5 text-slate-500">
          {description}
        </Text>
      ) : null}
    </View>
  );
};

export default EmptyState;
