import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import NotificationItem from "../components/NotificationItem";
import EmptyState from "../components/ui/EmptyState";
import {
  fetchStaffNotifications,
  markNotificationAsRead,
  type StaffNotification,
} from "../services/notificationService";
import { showToast } from "../utils/toast";

const NotificationScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchStaffNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      if (!isSilent) {
        showToast("Không thể tải danh sách thông báo");
      }
    } finally {
      if (isSilent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(false);
    }, [fetchNotifications]),
  );

  const handleNotificationPress = async (item: StaffNotification) => {
    if (!item.id) return;

    const previousIsRead = item.isRead;

    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );

      if (!previousIsRead) {
        await markNotificationAsRead(item.id);
      }

      if (item.orderId) {
        // Current app route expects invoiceId in OrderDetails params.
        navigation.navigate("OrderDetails", { invoiceId: item.orderId });
      } else {
        showToast("Thông báo chưa có mã đơn để mở chi tiết");
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, isRead: previousIsRead } : n,
        ),
      );
      showToast("Không thể cập nhật trạng thái thông báo");
    }
  };

  return (
    <View className="flex-1 bg-[#edf4ef] pt-12">
      <View className="flex-row items-center px-4 pb-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text className="ml-4 text-2xl font-extrabold text-slate-900">
          Thông Báo
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="Thông báo trống"
          description="Bạn chưa nhận được thông báo nào. Mọi tin tức mới sẽ được cập nhật tại đây."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={handleNotificationPress} />
          )}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              tintColor="#0f766e"
            />
          }
        />
      )}
    </View>
  );
};

export default NotificationScreen;
