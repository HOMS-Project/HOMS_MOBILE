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
import Section from "../components/ui/Section";
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
      return "Cho xac nhan";
    case "ASSIGNED":
      return "Da phan cong";
    case "ACCEPTED":
      return "Da nhan don";
    case "IN_PROGRESS":
      return "Dang thuc hien";
    case "COMPLETED":
      return "Da hoan tat";
    case "CANCELLED":
      return "Da huy";
    default:
      return status || "Khong ro";
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
        <Card className="gap-4 p-5">
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <Text className="text-lg font-extrabold text-slate-900">
                {order.orderCode || "Order"}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                {order.scheduledTime
                  ? new Date(order.scheduledTime).toLocaleString()
                  : "No schedule"}
              </Text>
            </View>
            <View
              className={`rounded-full px-3 py-1 ${getStatusStyle(order.status || "")}`}
            >
              <Text className="text-xs font-bold">
                {getStatusLabel(order.status || "")}
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={10} color="#2563eb" />
              <Text className="flex-1 text-sm text-slate-700" numberOfLines={1}>
                {order.pickup?.address || "No pickup address"}
              </Text>
            </View>
            <View className="ml-1 h-4 w-px bg-slate-300" />
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={10} color="#ef4444" />
              <Text className="flex-1 text-sm text-slate-700" numberOfLines={1}>
                {order.delivery?.address || "No delivery address"}
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
        <View className="rounded-b-[34px] bg-slate-900 px-6 pb-7 pt-14">
          <View className="flex-row items-center">
            <View className="h-16 w-16 overflow-hidden rounded-full border-2 border-white/40 bg-slate-700">
              {loading ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator color="#ffffff" />
                </View>
              ) : (
                <Image
                  source={{ uri: user?.avatar || fallbackAvatar }}
                  className="h-16 w-16"
                />
              )}
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-xl font-extrabold text-white">
                {user?.fullName || user?.username || "Tai xe"}
              </Text>
              <Text className="mt-1 text-sm font-medium text-white/70">
                {(user?.role || "Nhan vien").toString().toUpperCase()}
              </Text>
            </View>

            <Pressable className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#ffffff"
              />
            </Pressable>
          </View>

          <View className="mt-6 flex-row gap-3">
            <Pressable
              className="flex-1 items-center rounded-2xl bg-white/90 px-3 py-4"
              onPress={() => navigation.navigate("MySchedule")}
            >
              <Ionicons name="calendar-outline" size={20} color="#0f172a" />
              <Text className="mt-2 text-center text-xs font-bold text-slate-900">
                Lich cua toi
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 items-center rounded-2xl bg-white/90 px-3 py-4"
              onPress={() => navigation.navigate("OrderList")}
            >
              <Ionicons name="receipt-outline" size={20} color="#0f172a" />
              <Text className="mt-2 text-center text-xs font-bold text-slate-900">
                Danh sach don
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 items-center rounded-2xl bg-white/90 px-3 py-4"
              onPress={goToOrderMap}
            >
              <Ionicons name="map-outline" size={20} color="#0f172a" />
              <Text className="mt-2 text-center text-xs font-bold text-slate-900">
                Ban do
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="px-5">
          <Section
            title="Current Order"
            actionLabel="View all"
            onActionPress={() => navigation.navigate("OrderList")}
          />

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
                    <Text className="text-lg font-extrabold text-slate-900">
                      {currentOrder.orderCode || "Order"}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-500">
                      {currentOrder.scheduledTime
                        ? new Date(
                            currentOrder.scheduledTime,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "No schedule"}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${getStatusStyle(currentOrder.status || "")}`}
                  >
                    <Text className="text-xs font-bold">
                      {getStatusLabel(currentOrder.status || "")}
                    </Text>
                  </View>
                </View>

                <View className="rounded-2xl bg-white/80 p-3">
                  <View className="flex-row items-start gap-2">
                    <Ionicons
                      name="navigate-circle"
                      size={18}
                      color="#2563eb"
                    />
                    <Text
                      className="flex-1 text-sm font-medium text-slate-700"
                      numberOfLines={1}
                    >
                      {currentOrder.pickup?.address || "No pickup address"}
                    </Text>
                  </View>
                  <View className="my-2 h-px bg-slate-200" />
                  <View className="flex-row items-start gap-2">
                    <Ionicons name="flag" size={18} color="#ef4444" />
                    <Text
                      className="flex-1 text-sm font-medium text-slate-700"
                      numberOfLines={1}
                    >
                      {currentOrder.delivery?.address || "No delivery address"}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ) : (
            <Card className="items-center py-8">
              <Text className="text-sm font-medium text-slate-500">
                Chua co don hang duoc phan cong
              </Text>
            </Card>
          )}

          <Section
            title="Recent Orders"
            actionLabel="View all"
            onActionPress={() => navigation.navigate("OrderList")}
          />

          {recentOrders.length > 0 ? (
            recentOrders.map((item) => renderOrderCard(item))
          ) : (
            <Card className="items-center py-8">
              <Text className="text-sm font-medium text-slate-500">
                Khong co don da hoan tat trong 7 ngay qua
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default StaffHomeScreen;
