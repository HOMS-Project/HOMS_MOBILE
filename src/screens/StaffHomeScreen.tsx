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
import type { RootStackParamList } from "../../App";
import Card from "../components/ui/Card";
import { apiRequest, endpoints } from "../api";

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
  if (status === "IN_PROGRESS") return "bg-sky-100 text-sky-700";
  if (status === "ACCEPTED") return "bg-emerald-100 text-emerald-700";
  if (status === "ASSIGNED") return "bg-amber-100 text-amber-700";
  if (status === "COMPLETED") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-600";
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
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return ts >= cutoff;
    })
    .sort(
      (a, b) =>
        new Date(b.scheduledTime || "").getTime() -
        new Date(a.scheduledTime || "").getTime(),
    )
    .slice(0, 4);

  const goToOrderMap = () => {
    const invoiceId =
      currentOrder?.invoiceId || currentOrder?.id || currentOrder?._id;
    if (invoiceId && currentOrder?.assignmentId) {
      navigation.navigate("OrderMap", {
        assignmentId: currentOrder.assignmentId,
        invoiceId,
      });
      return;
    }
    navigation.navigate("OrderList");
  };

  const renderOrderCard = (order: DashboardOrder) => {
    const invoiceId = order.invoiceId || order.id || order._id;
    if (!invoiceId) return null;

    return (
      <Pressable
        key={invoiceId}
        className="mb-3"
        onPress={() => navigation.navigate("OrderDetails", { invoiceId })}
      >
        <Card className="gap-4 p-6">
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <Text className="text-2xl font-extrabold text-slate-900">
                {order.orderCode || "Đơn hàng"}
              </Text>
              <Text className="mt-1 text-base text-slate-500">
                {order.scheduledTime
                  ? new Date(order.scheduledTime).toLocaleString()
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

  return (
    <View className="flex-1 bg-slate-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-b-[34px] bg-slate-900 px-6 pb-8 pt-14">
          <View className="flex-row items-center">
            <View className="h-24 w-24 overflow-hidden rounded-full border-2 border-white/40 bg-slate-700">
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
              <Text className="mt-1 text-lg font-semibold text-white/75">
                {(user?.role || "Nhân viên").toString().toUpperCase()}
              </Text>
            </View>

            <Pressable 
              className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15"
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
              className="flex-1 items-center rounded-2xl bg-white/90 px-3 py-5"
              onPress={() => navigation.navigate("MySchedule")}
            >
              <Ionicons name="calendar-outline" size={28} color="#0f172a" />
              <Text className="mt-2 text-center text-base font-extrabold text-slate-900">
                Lịch của tôi
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 items-center rounded-2xl bg-white/90 px-3 py-5"
              onPress={() => navigation.navigate("OrderList")}
            >
              <Ionicons name="receipt-outline" size={28} color="#0f172a" />
              <Text className="mt-2 text-center text-base font-extrabold text-slate-900">
                Danh sách đơn
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 items-center rounded-2xl bg-white/90 px-3 py-5"
              onPress={goToOrderMap}
            >
              <Ionicons name="map-outline" size={28} color="#0f172a" />
              <Text className="mt-2 text-center text-base font-extrabold text-slate-900">
                Bản đồ
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="px-5">
          <View className="mb-3 mt-6 flex-row items-center justify-between">
            <Text className="text-3xl font-extrabold text-slate-900">
              Current Order
            </Text>
            <Pressable onPress={() => navigation.navigate("OrderList")}>
              <Text className="text-xl font-bold text-emerald-600">
                Xem tất cả
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View className="mt-2 items-center">
              <ActivityIndicator color="#0f766e" />
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
              <Card className="gap-4 border-emerald-200 bg-emerald-50/70 p-5">
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

                <View className="rounded-2xl bg-white/80 p-3">
                  <View className="flex-row items-start gap-2">
                    <Ionicons
                      name="navigate-circle"
                      size={20}
                      color="#2563eb"
                    />
                    <Text
                      className="flex-1 text-base font-medium text-slate-700"
                      numberOfLines={1}
                    >
                      {currentOrder.pickup?.address ||
                        "Chưa có địa chỉ lấy hàng"}
                    </Text>
                  </View>
                  <View className="my-2 h-px bg-slate-200" />
                  <View className="flex-row items-start gap-2">
                    <Ionicons name="flag" size={20} color="#ef4444" />
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
            <Card className="items-center py-10">
              <Text className="text-xl font-medium text-slate-500">
                Chưa có đơn hàng được phân công
              </Text>
            </Card>
          )}

          <View className="mb-3 mt-6 flex-row items-center justify-between">
            <Text className="text-3xl font-extrabold text-slate-900">
              Recent Orders
            </Text>
            <Pressable onPress={() => navigation.navigate("OrderList")}>
              <Text className="text-xl font-bold text-emerald-600">
                Xem tất cả
              </Text>
            </Pressable>
          </View>

          {recentOrders.length > 0 ? (
            recentOrders.map((item) => renderOrderCard(item))
          ) : (
            <Card className="items-center py-8">
              <Text className="text-lg font-medium text-slate-500">
                Không có đơn đã hoàn tất trong 7 ngày qua
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default StaffHomeScreen;
