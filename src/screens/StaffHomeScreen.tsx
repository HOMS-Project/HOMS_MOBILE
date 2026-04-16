import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { RootStackParamList } from "../../App";
import Card from "../components/ui/Card";
import { apiRequest, endpoints } from "../api";
import LocationTrackingService from "../services/locationTrackingService";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type DashboardOrder = {
  _id?: string;
  id?: string;
  invoiceId?: string;
  assignmentId?: string;
  orderCode?: string;
  status?: string;
  scheduledTime?: string;
  pickup?: { address?: string };
  delivery?: { address?: string };
};

const fallbackAvatar =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80";

const getRoleLabel = (role?: string) => {
  switch ((role || "").toLowerCase()) {
    case "driver":
      return "Tài xế";
    case "staff":
      return "Nhân viên";
    case "dispatcher":
      return "Điều phối viên";
    case "admin":
      return "Quản trị viên";
    case "customer":
      return "Khách hàng";
    default:
      return "Nhân viên";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "PENDING":
      return "Chờ xác nhận";
    case "ASSIGNED":
      return "Đã phân công";
    case "ACCEPTED":
      return "Đã nhận đơn";
    case "IN_PROGRESS":
      return "Đang thực hiện";
    case "COMPLETED":
      return "Đã hoàn tất";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status || "Không rõ";
  }
};

const getStatusStyle = (status: string) => {
  if (status === "IN_PROGRESS") return "bg-emerald-100 text-emerald-800";
  if (status === "ACCEPTED") return "bg-green-100 text-green-800";
  if (status === "ASSIGNED") return "bg-lime-100 text-lime-800";
  if (status === "COMPLETED")
    return "border border-emerald-200 bg-emerald-50 text-emerald-800";
  return "bg-emerald-100 text-emerald-700";
};

const StaffHomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [user, setUser] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const ordersPromise = apiRequest(endpoints.staff.getOrders)
        .then((res) => {
          if (res.success) setOrders(res.data || []);
        })
        .catch((err) => console.error("Orders fetch failed:", err));

      const profilePromise = apiRequest(endpoints.user.getProfile)
        .then((res) => {
          if (res.success) setUser(res.data);
        })
        .catch((err) => console.error("Profile fetch failed:", err));

      await Promise.all([ordersPromise, profilePromise]);
    } catch (error) {
      console.error("Fetch data general error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user && (user.id || user._id)) {
      const uid = user.id || user._id;
      const role = user.role || 'driver';
      LocationTrackingService.startTracking(uid, role);
    }
    return () => {
      LocationTrackingService.stopTracking();
    };
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const normalizedOrders = useMemo(
    () =>
      orders.map((o) => ({
        ...o,
        status: (o.status || "").toUpperCase(),
      })),
    [orders],
  );

  const currentOrder =
    normalizedOrders.find((o) =>
      ["IN_PROGRESS", "ACCEPTED", "ASSIGNED"].includes(o.status || ""),
    ) || null;

  const recentOrders = normalizedOrders
    .filter((o) => {
      if (o.status !== "COMPLETED") return false;
      const ts = new Date(o.scheduledTime || "").getTime();
      if (Number.isNaN(ts)) return false;
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return ts >= cutoff;
    })
    .sort(
      (a, b) =>
        new Date(b.scheduledTime || "").getTime() -
        new Date(a.scheduledTime || "").getTime(),
    )
    .slice(0, 4);

  const renderOrderCard = (order: DashboardOrder) => {
    const invoiceId = order.invoiceId || order.id || order._id;
    if (!invoiceId) return null;

    return (
      <Pressable
        key={invoiceId}
        className="mb-3"
        onPress={() => navigation.navigate("OrderDetails", { invoiceId })}
      >
        <Card className="gap-4 rounded-[24px] border-emerald-100 bg-white p-6 shadow-sm">
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <Text className="text-2xl font-extrabold text-slate-900">
                {order.orderCode || "Đơn hàng"}
              </Text>
              <Text className="mt-1 text-base text-slate-500">
                {order.scheduledTime
                  ? new Date(order.scheduledTime).toLocaleString("vi-VN")
                  : "Chưa có lịch"}
              </Text>
            </View>
            <View
              className={`rounded-full px-4 py-2 ${getStatusStyle(order.status || "")}`}
            >
              <Text className="text-base font-bold">
                {getStatusLabel(order.status || "")}
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={12} color="#2563eb" />
              <Text className="flex-1 text-lg text-slate-700" numberOfLines={1}>
                {order.pickup?.address || "Chưa có địa chỉ lấy hàng"}
              </Text>
            </View>
            <View className="ml-1 h-5 w-px bg-slate-300" />
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={12} color="#ef4444" />
              <Text className="flex-1 text-lg text-slate-700" numberOfLines={1}>
                {order.delivery?.address || "Chưa có địa chỉ giao hàng"}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  const goToTeamList = () => {
    navigation.navigate("TeamList");
  };

  return (
    <View className="flex-1 bg-[#edf4ef]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#0f3f2a", "#156f45", "#1d8a55"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-b-[34px] px-6 pb-8 pt-14"
        >
          <View className="flex-row items-center">
            <View className="h-24 w-24 overflow-hidden rounded-full border-2 border-white/50 bg-emerald-950/50">
              {loading ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator color="#ffffff" />
                </View>
              ) : (
                <Image
                  source={{ uri: user?.avatar || fallbackAvatar }}
                  className="h-24 w-24"
                />
              )}
            </View>

            <View className="ml-5 flex-1">
              <Text className="text-4xl font-extrabold text-white">
                {user?.fullName || user?.username || "Tài xế"}
              </Text>
              <Text className="mt-1 text-lg font-semibold text-emerald-100/90">
                {getRoleLabel(user?.role)}
              </Text>
              
              {user && (
                <View className="mt-2 flex-row items-center self-start rounded-full border border-emerald-400/30 bg-emerald-800/40 px-3 py-1">
                  <View className="mr-2 h-2.5 w-2.5 rounded-full bg-green-400" style={{ shadowColor: '#4ade80', shadowOpacity: 0.8, shadowRadius: 4 }} />
                  <Text className="text-xs font-semibold text-emerald-50">GPS Đang phát tín hiệu</Text>
                </View>
              )}
            </View>

            <Pressable
              className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20"
              onPress={() => navigation.navigate("Notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#ffffff"
              />
            </Pressable>
          </View>

          <View className="mt-7 flex-row gap-3">
            <Pressable
              className="flex-1 items-center rounded-2xl border border-emerald-100 bg-[#f4fbf6] px-3 py-5"
              onPress={() => navigation.navigate("OrderList")}
            >
              <Ionicons name="receipt-outline" size={28} color="#166534" />
              <Text className="mt-2 text-center text-base font-extrabold text-slate-800">
                Danh sách đơn
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 items-center rounded-2xl border border-emerald-100 bg-[#f4fbf6] px-3 py-5"
              onPress={goToTeamList}
            >
              <Ionicons name="people-outline" size={28} color="#166534" />
              <Text className="mt-2 text-center text-base font-extrabold text-slate-800">
                Quản lý đội
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 items-center rounded-2xl border border-emerald-100 bg-[#f4fbf6] px-3 py-5"
              onPress={() => navigation.navigate("IncidentList")}
            >
              <Ionicons name="warning-outline" size={28} color="#166534" />
              <Text className="mt-2 text-center text-base font-extrabold text-slate-800">
                Báo cáo sự cố
              </Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View className="px-5">
          <View className="mb-3 mt-6 flex-row items-center justify-between">
            <Text className="text-3xl font-extrabold text-slate-900">
              Đơn đang hoạt động
            </Text>
            <Pressable onPress={() => navigation.navigate("OrderList")}>
              <Text className="text-xl font-bold text-emerald-700">
                Xem tất cả
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View className="mt-2 items-center">
              <ActivityIndicator color="#15803d" />
            </View>
          ) : currentOrder ? (
            <Pressable
              onPress={() => {
                const invoiceId =
                  currentOrder.invoiceId || currentOrder.id || currentOrder._id;
                if (invoiceId) {
                  navigation.navigate("OrderDetails", { invoiceId });
                }
              }}
            >
              <Card className="gap-4 border-emerald-200 bg-[#ecf8ef] p-5">
                <View className="flex-row items-start justify-between">
                  <View className="mr-3 flex-1">
                    <Text className="text-xl font-extrabold text-slate-900">
                      {currentOrder.orderCode || "Đơn hàng"}
                    </Text>
                    <Text className="mt-1 text-base text-slate-500">
                      {currentOrder.scheduledTime
                        ? new Date(
                          currentOrder.scheduledTime,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "Chưa có lịch"}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${getStatusStyle(currentOrder.status || "")}`}
                  >
                    <Text className="text-sm font-bold">
                      {getStatusLabel(currentOrder.status || "")}
                    </Text>
                  </View>
                </View>

                <View className="gap-3">
                  <View className="flex-row items-start gap-2">
                    <Ionicons name="ellipse" size={12} color="#2563eb" />
                    <Text
                      className="flex-1 text-base font-medium text-slate-700"
                      numberOfLines={1}
                    >
                      {currentOrder.pickup?.address ||
                        "Chưa có địa chỉ lấy hàng"}
                    </Text>
                  </View>
                  <View className="ml-1 h-5 w-px bg-slate-300" />
                  <View className="flex-row items-start gap-2">
                    <Ionicons name="ellipse" size={12} color="#ef4444" />
                    <Text
                      className="flex-1 text-base font-medium text-slate-700"
                      numberOfLines={1}
                    >
                      {currentOrder.delivery?.address ||
                        "Chưa có địa chỉ giao hàng"}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ) : (
            <Card className="items-center border-emerald-100 bg-white py-10">
              <Text className="text-xl font-medium text-slate-500">
                Chưa có đơn hàng nào đang hoạt động.
              </Text>
            </Card>
          )}

          <View className="mb-3 mt-6 flex-row items-center justify-between">
            <Text className="text-3xl font-extrabold text-slate-900">
              Các đơn gần đây
            </Text>
            <Pressable onPress={() => navigation.navigate("OrderList")}>
              <Text className="text-xl font-bold text-emerald-700">
                Xem tất cả
              </Text>
            </Pressable>
          </View>

          {recentOrders.length > 0 ? (
            recentOrders.map((item) => renderOrderCard(item))
          ) : (
            <Card className="items-center border-emerald-100 bg-white py-8">
              <Text className="text-lg font-medium text-slate-500">
                Không có đơn đã hoàn tất trong 1 tháng qua
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default StaffHomeScreen;
