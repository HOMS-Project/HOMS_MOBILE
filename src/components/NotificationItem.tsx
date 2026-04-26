import React, { useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { StaffNotification } from "../services/notificationService";

type NotificationItemProps = {
  item: StaffNotification;
  onPress: (item: StaffNotification) => void;
};

const formatTime = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Vừa xong";
  return d.toLocaleString("vi-VN", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationItem: React.FC<NotificationItemProps> = ({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.timing(scaleAnim, {
      toValue,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const unread = !item.isRead;

  return (
    <Pressable
      className="mb-3"
      onPress={() => onPress(item)}
      onPressIn={() => animateTo(0.985)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View
        className={`rounded-xl border p-3.5 ${
          unread
            ? "border-emerald-300 bg-emerald-50"
            : "border-slate-200 bg-white"
        }`}
        style={{
          transform: [{ scale: scaleAnim }],
          shadowColor: unread ? "#059669" : "#0f172a",
          shadowOpacity: unread ? 0.2 : 0.08,
          shadowRadius: unread ? 10 : 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: unread ? 4 : 2,
        }}
      >
        <View className="flex-row items-start gap-3">
          <View
            className={`h-9 w-9 items-center justify-center rounded-full ${
              unread ? "bg-emerald-100" : "bg-slate-100"
            }`}
          >
            <Ionicons
              name="notifications"
              size={18}
              color={unread ? "#047857" : "#64748b"}
            />
          </View>

          <View className="flex-1">
            <Text
              className={`text-[15px] ${
                unread
                  ? "font-extrabold text-emerald-900"
                  : "font-bold text-slate-800"
              }`}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="mt-0.5 text-[13px] leading-5 text-slate-600" numberOfLines={2}>
              {item.message}
            </Text>
            <Text className="mt-2 text-xs text-slate-400">{formatTime(item.createdAt)}</Text>
          </View>

          {unread ? (
            <View className="mt-1 items-center justify-center rounded-full bg-amber-500/10 px-2.5 py-1">
              <Ionicons name="alert-circle" size={16} color="#f59e0b" />
            </View>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default NotificationItem;
