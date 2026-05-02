import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  TextInput,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { staffApi } from "../api";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { showToast } from "../utils/toast";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Order = {
  dispatchAssignmentId: string;
  assignmentId: string;
  invoiceId: string;
  orderCode: string;
  status: string;
  pickup: { address: string; district: string };
  delivery: { address: string; district: string };
  scheduledTime: string;
  moveType: string;
  items: { name: string; quantity: number }[];
};

type StatusFilter = "ALL" | "IN_PROGRESS" | "ACCEPTED" | "COMPLETED" | "ASSIGNED" | "CANCELLED" | "OTHER";
type TimeFilter = "ALL" | "TODAY" | "WEEK" | "MONTH";
type ServiceTypeFilter = "ALL" | "FULL_HOUSE" | "SPECIFIC_ITEMS" | "TRUCK_RENTAL";
type SortOrder = "DESC" | "ASC";

const statusLabel = (status: string) => {
  if (status === "IN_PROGRESS") return "Đang thực hiện";
  if (status === "ACCEPTED") return "Đã nhận";
  if (status === "COMPLETED") return "Đã hoàn tất";
  if (status === "ASSIGNED") return "Đã phân công";
  if (status === "CONFIRMED") return "Đã xác nhận";
  if (status === "PENDING") return "Chờ xử lý";
  if (status === "CANCELLED") return "Đã hủy";
  return "Khác";
};

const statusClass = (status: string) => {
  if (status === "IN_PROGRESS") return "bg-sky-100 text-sky-700";
  if (status === "ACCEPTED") return "bg-amber-100 text-amber-700";
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (status === "ASSIGNED") return "bg-violet-100 text-violet-700";
  if (status === "CANCELLED") return "bg-rose-100 text-rose-700";
  if (status === "CONFIRMED") return "bg-blue-100 text-blue-700";
  if (status === "PENDING") return "bg-slate-100 text-slate-700";
  return "bg-emerald-100 text-emerald-700";
};

const filterLabel = (filter: StatusFilter | TimeFilter | ServiceTypeFilter | SortOrder) => {
  if (filter === "ALL") return "Tất cả";
  if (filter === "IN_PROGRESS") return "Đang thực hiện";
  if (filter === "ACCEPTED") return "Đã nhận";
  if (filter === "COMPLETED") return "Đã hoàn tất";
  if (filter === "ASSIGNED") return "Đã phân công";
  if (filter === "CANCELLED") return "Đã hủy";
  if (filter === "OTHER") return "Khác";
  if (filter === "TODAY") return "Hôm nay";
  if (filter === "WEEK") return "Tuần này";
  if (filter === "MONTH") return "Tháng này";
  if (filter === "DESC") return "Mới nhất";
  if (filter === "ASC") return "Cũ nhất";
  if (filter === "FULL_HOUSE") return "Chuyển nhà";
  if (filter === "SPECIFIC_ITEMS") return "Chuyển đồ";
  if (filter === "TRUCK_RENTAL") return "Thuê xe tải";
  return filter;
};

const OrderListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL");
  const [serviceFilter, setServiceFilter] = useState<ServiceTypeFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");

  const fetchOrders = useCallback(async () => {
    try {
      const result = await staffApi.getOrders();
      const payload = (result as any)?.data ?? result;
      setOrders(payload || []);
    } catch (error: any) {
      console.error("Fetch orders failed:", error);
      showToast(error?.message || "Không thể tải danh sách đơn");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#edf4ef]">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const normalized = orders
    .map((o) => ({
      ...o,
      status: (o.status || "").toUpperCase(),
      items: Array.isArray((o as any)?.items) ? (o as any).items : [],
    }))
    .sort((a, b) => {
      const timeA = new Date(a.scheduledTime || 0).getTime();
      const timeB = new Date(b.scheduledTime || 0).getTime();
      return sortOrder === "DESC" ? timeB - timeA : timeA - timeB;
    });

  const applyTimeFilter = (o: Order) => {
    if (timeFilter === "ALL") return true;
    const ts = new Date(o.scheduledTime).getTime();
    if (Number.isNaN(ts)) return false;
    const now = Date.now();
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    if (timeFilter === "TODAY") return ts >= startToday.getTime();
    if (timeFilter === "WEEK") return ts >= now - 7 * 24 * 60 * 60 * 1000;
    if (timeFilter === "MONTH") return ts >= now - 30 * 24 * 60 * 60 * 1000;
    return true;
  };

  const filtered = normalized.filter((o) => {
    const statusOk =
      statusFilter === "ALL"
        ? true
        : statusFilter === "OTHER"
          ? !["IN_PROGRESS", "ACCEPTED", "COMPLETED", "ASSIGNED", "CANCELLED"].includes(o.status)
          : o.status === statusFilter;
    const timeOk = applyTimeFilter(o);
    const serviceOk = serviceFilter === "ALL" ? true : o.moveType === serviceFilter;
    const searchOk = o.orderCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusOk && timeOk && serviceOk && searchOk;
  });

  const inProgress = filtered.filter((o) => o.status === "IN_PROGRESS");
  const accepted = filtered.filter((o) => o.status === "ACCEPTED");
  const others = filtered.filter(
    (o) => !["IN_PROGRESS", "ACCEPTED"].includes(o.status),
  );

  const renderOrderCard = (order: Order) => {
    return (
      <Pressable
        key={order.invoiceId}
        className="mb-3"
        onPress={() => {
          const id = order.invoiceId || (order as any).id || (order as any)._id;
          if (id) {
            navigation.navigate("OrderDetails", { invoiceId: id });
          }
        }}
      >
        <Card className="gap-3 rounded-[20px] p-4">
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">📦</Text>
                <Text className="text-base font-bold text-slate-900">
                  {order.orderCode}
                </Text>
                {order.moveType === "TRUCK_RENTAL" && (
                  <View className="rounded-full bg-orange-100 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-orange-700">Thuê xe</Text>
                  </View>
                )}
                {order.moveType === "FULL_HOUSE" && (
                  <View className="rounded-full bg-blue-100 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-blue-700">Chuyển nhà</Text>
                  </View>
                )}
                {order.moveType === "SPECIFIC_ITEMS" && (
                  <View className="rounded-full bg-purple-100 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-purple-700">Chuyển đồ</Text>
                  </View>
                )}
              </View>
              <Text className="mt-0.5 text-sm text-slate-500">
                {new Date(order.scheduledTime).toLocaleDateString()} ·{" "}
                {new Date(order.scheduledTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <View
              className={`rounded-full px-3 py-1 ${statusClass(order.status)}`}
            >
              <Text className="text-[11px] font-bold">
                {statusLabel(order.status)}
              </Text>
            </View>
          </View>

          <View className="gap-2.5 p-1">
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={9} color="#2563eb" />
              <Text
                className="flex-1 text-sm font-medium text-slate-700"
                numberOfLines={1}
              >
                {order.pickup.address}
              </Text>
            </View>

            <View className="ml-1 h-4 w-px bg-slate-300" />

            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={9} color="#ef4444" />
              <Text
                className="flex-1 text-sm font-medium text-slate-700"
                numberOfLines={1}
              >
                {order.delivery.address}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  const renderChip = (
    value: StatusFilter | TimeFilter | ServiceTypeFilter | SortOrder,
    selected: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      key={value}
      className={`mb-2 mr-2 rounded-full border px-3 py-1.5 ${selected ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}
      onPress={onPress}
    >
      <Text
        className={`text-sm font-bold ${selected ? "text-emerald-700" : "text-slate-600"}`}
      >
        {filterLabel(value)}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-[#edf4ef]">
      <View className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/35" />
      <View className="absolute -left-16 bottom-14 h-56 w-56 rounded-full bg-sky-200/40" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingTop: 32,
          paddingBottom: 24,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="mt-1 flex-row items-center">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </Pressable>
          <Text className="ml-3 flex-1 text-xl font-extrabold text-slate-900">
            Đơn hàng đã phân công
          </Text>
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm"
            onPress={() => setShowFilters((prev) => !prev)}
          >
            <Ionicons
              name={showFilters ? "close" : "options-outline"}
              size={20}
              color="#0f172a"
            />
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            className="ml-2 flex-1 text-base text-slate-900"
            placeholder="Tìm theo mã đơn hàng..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#cbd5e1" />
            </Pressable>
          ) : null}
        </View>

        {showFilters ? (
          <Card className="mt-5 rounded-[24px] p-5">
            <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Trạng thái
            </Text>
            <View className="mt-2 flex-row flex-wrap">
              {(
                [
                  "ALL",
                  "IN_PROGRESS",
                  "ACCEPTED",
                  "ASSIGNED",
                  "COMPLETED",
                  "CANCELLED",
                  "OTHER",
                ] as const
              ).map((s) =>
                renderChip(s, statusFilter === s, () => setStatusFilter(s)),
              )}
            </View>

            <Text className="mt-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Thời gian
            </Text>
            <View className="mt-2 flex-row flex-wrap">
              {(["ALL", "TODAY", "WEEK", "MONTH"] as const).map((t) =>
                renderChip(t, timeFilter === t, () => setTimeFilter(t)),
              )}
            </View>

            <Text className="mt-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Loại dịch vụ
            </Text>
            <View className="mt-2 flex-row flex-wrap">
              {(["ALL", "FULL_HOUSE", "SPECIFIC_ITEMS", "TRUCK_RENTAL"] as const).map((s) =>
                renderChip(s, serviceFilter === s, () => setServiceFilter(s)),
              )}
            </View>

            <Text className="mt-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Sắp xếp
            </Text>
            <View className="mt-2 flex-row flex-wrap">
              {(["DESC", "ASC"] as const).map((s) =>
                renderChip(s, sortOrder === s, () => setSortOrder(s)),
              )}
            </View>
          </Card>
        ) : null}

        {inProgress.length > 0 ? (
          <>
            <Text className="mb-2.5 mt-8 text-lg font-extrabold text-slate-900">
              Đang thực hiện
            </Text>
            {inProgress.map(renderOrderCard)}
          </>
        ) : null}

        {accepted.length > 0 ? (
          <>
            <Text className="mb-2.5 mt-8 text-lg font-extrabold text-slate-900">
              Đã nhận
            </Text>
            {accepted.map(renderOrderCard)}
          </>
        ) : null}

        {others.length > 0 ? (
          <View className="mt-10">
            {others.map(renderOrderCard)}
          </View>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            icon="list-outline"
            title="Chưa có đơn hàng nào"
            description="Hiện tại không có đơn hàng nào phù hợp với bộ lọc của bạn."
            className="mt-4"
          />
        ) : null}
      </ScrollView>
    </View>
  );
};

export default OrderListScreen;
