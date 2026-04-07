import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { staffApi } from "../api";
import Card from "../components/ui/Card";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
};

const NotificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await staffApi.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    try {
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      await staffApi.markNotificationRead(item._id);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <Pressable onPress={() => handleMarkAsRead(item)} className="mb-3">
      <Card
        className={`p-4 flex-row gap-3 items-center ${
          item.isRead ? "bg-white" : "bg-[#f0f5ff] border border-blue-200"
        }`}
      >
        <View
          className={`h-12 w-12 rounded-full items-center justify-center ${
            item.isRead ? "bg-slate-100" : "bg-blue-100"
          }`}
        >
          <Ionicons
            name={
              item.type === "Payment"
                ? "card"
                : item.type === "Assignment"
                ? "car"
                : "notifications"
            }
            size={24}
            color={item.isRead ? "#94a3b8" : "#2563eb"}
          />
        </View>
        <View className="flex-1">
          <Text
            className={`text-base flex-wrap ${
              item.isRead ? "font-semibold text-slate-800" : "font-extrabold text-blue-900"
            }`}
          >
            {item.title}
          </Text>
          <Text className="text-sm text-slate-500 mt-1 flex-wrap">{item.message}</Text>
          <Text className="text-xs text-slate-400 mt-2">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        {!item.isRead && (
          <View className="h-3 w-3 rounded-full bg-blue-500" />
        )}
      </Card>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-slate-50 pt-12">
      <View className="flex-row items-center px-4 pb-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text className="ml-4 text-2xl font-extrabold text-slate-900">Thông Báo</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center py-20 px-4">
          <Ionicons name="notifications-off-outline" size={60} color="#cbd5e1" />
          <Text className="text-lg text-slate-500 mt-4 text-center">
            Bạn chưa có thông báo nào.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default NotificationScreen;
