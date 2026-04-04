import React from "react";
import { Pressable, Text, View } from "react-native";

type SectionProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

const Section: React.FC<SectionProps> = ({
  title,
  actionLabel = "Xem tất cả",
  onActionPress,
}) => {
  return (
    <View className="mb-3 mt-6 flex-row items-center justify-between">
      <Text className="text-xl font-extrabold text-slate-900">{title}</Text>
      {onActionPress ? (
        <Pressable onPress={onActionPress}>
          <Text className="text-sm font-semibold text-emerald-600">
            {actionLabel}
          </Text>
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  );
};

export default Section;
