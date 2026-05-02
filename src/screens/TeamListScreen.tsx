import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import Card from "../components/ui/Card";
import { showToast } from "../utils/toast";
import {
  fetchAssignedInvoices,
  type TeamOrderSummary,
} from "../services/staffFeatureService";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortOrder = "DESC" | "ASC";
type StatusFilter =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

const STATUS_LABEL: Record<StatusFilter, string> = {
  ALL: "Tất cả",
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  ASSIGNED: "Đã phân công",
  ACCEPTED: "Đã nhận",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};

const statusClass = (status: string) => {
  if (status === "IN_PROGRESS") return "bg-sky-100 text-sky-700";
  if (status === "ACCEPTED") return "bg-amber-100 text-amber-700";
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (status === "CANCELLED") return "bg-rose-100 text-rose-700";
  if (status === "PENDING") return "bg-emerald-100 text-emerald-700";
  return "bg-violet-100 text-violet-700";
};

const TeamListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [orders, setOrders] = useState<TeamOrderSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");

  const fetchTeamOrders = useCallback(async () => {
    try {
      const data = await fetchAssignedInvoices();
      setOrders(data);
    } catch (error: any) {
      console.error("Fetch team orders failed:", error);
      showToast(error?.message || "Không thể tải danh sách quản lý đội");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTeamOrders();
    }, [fetchTeamOrders]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeamOrders();
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("MainTabs");
  };

  const filteredOrders = useMemo(() => {
    const base = orders.filter((order) => {
      const statusOk = statusFilter === "ALL" || order.status === statusFilter;
      const searchOk = order.orderCode?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (searchQuery === "");
      return statusOk && searchOk;
    });
    
    // Sắp xếp theo scheduledTime
    return [...base].sort((a, b) => {
      const timeA = new Date(a.scheduledTime || 0).getTime();
      const timeB = new Date(b.scheduledTime || 0).getTime();
      return sortOrder === "DESC" ? timeB - timeA : timeA - timeB;
    });
  }, [orders, statusFilter, searchQuery, sortOrder]);

  const availableFilters: StatusFilter[] = useMemo(() => {
    const allStatus = new Set<StatusFilter>(["ALL"]);
    orders.forEach((order) => {
      const raw = String(order.status || "").toUpperCase();
      if (raw in STATUS_LABEL) {
        allStatus.add(raw as StatusFilter);
      }
    });
    return Array.from(allStatus);
  }, [orders]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#edf4ef]">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

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
        <View className="flex-row items-center">
          <Pressable
            className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </Pressable>

          <Text className="flex-1 text-xl font-extrabold text-slate-900">
            Quản lý đội
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

        <Text className="mt-1 text-sm text-slate-500">
          Danh sách đơn có đội được phân công cho bạn
        </Text>

        <View className="mt-4 flex-row gap-3">
          <Card className="flex-1 rounded-2xl bg-white p-4">
            <Text className="text-2xl font-extrabold text-slate-900">{orders.length}</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Tổng số đơn</Text>
          </Card>
          <Card className="flex-1 rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
            <Text className="text-2xl font-extrabold text-emerald-700">
              {orders.filter(o => o.status === "IN_PROGRESS").length}
            </Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">Đang thực hiện</Text>
          </Card>
        </View>

        <View className="mt-4 flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            className="ml-2 flex-1 text-base text-slate-900"
            placeholder="Tìm theo mã đơn..."
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
          <Card className="mt-4 rounded-2xl p-4">
            <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Lọc theo trạng thái
            </Text>
            <View className="mt-2 flex-row flex-wrap">
              {availableFilters.map((value) => {
                const selected = statusFilter === value;
                return (
                  <Pressable
                    key={value}
                    className={`mb-2 mr-2 rounded-full border px-3 py-1.5 ${selected ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}
                    onPress={() => setStatusFilter(value)}
                  >
                    <Text
                      className={`text-sm font-bold ${selected ? "text-emerald-700" : "text-slate-600"}`}
                    >
                      {STATUS_LABEL[value]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Sắp xếp theo thời gian
            </Text>
            <View className="mt-2 flex-row flex-wrap">
              {(["DESC", "ASC"] as const).map((s) => (
                <Pressable
                  key={s}
                  className={`mb-2 mr-2 rounded-full border px-3 py-1.5 ${sortOrder === s ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}
                  onPress={() => setSortOrder(s)}
                >
                  <Text
                    className={`text-sm font-bold ${sortOrder === s ? "text-emerald-700" : "text-slate-600"}`}
                  >
                    {s === "DESC" ? "Mới nhất trước" : "Cũ nhất trước"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}

        <View className="mt-5 gap-3">
          {filteredOrders.map((order) => {
            const ts = new Date(order.scheduledTime || "").getTime();
            const dateText = Number.isNaN(ts)
              ? "Chưa có lịch"
              : `${new Date(ts).toLocaleDateString("vi-VN")} · ${new Date(
                  ts,
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`;

            return (
              <Pressable
                key={order.invoiceId}
                onPress={() =>
                  navigation.navigate("TeamDetail", {
                    invoiceId: order.invoiceId,
                  })
                }
              >
                <Card className="gap-3 rounded-2xl p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="mr-2 flex-1">
                      <Text className="text-base font-bold text-slate-900">
                        {order.orderCode}
                      </Text>
                      <Text className="mt-0.5 text-sm text-slate-500">
                        {dateText}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 ${statusClass(order.status)}`}
                    >
                      <Text className="text-[11px] font-bold">
                        {STATUS_LABEL[
                          (order.status as StatusFilter) || "ALL"
                        ] || order.status}
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
                        {order.pickupAddress || "Chưa có địa điểm nhận"}
                      </Text>
                    </View>

                    <View className="ml-1 h-4 w-px bg-slate-300" />

                    <View className="flex-row items-start gap-2">
                      <Ionicons name="ellipse" size={9} color="#ef4444" />
                      <Text
                        className="flex-1 text-sm font-medium text-slate-700"
                        numberOfLines={1}
                      >
                        {order.deliveryAddress || "Chưa có địa điểm giao"}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}

          {filteredOrders.length === 0 ? (
            <Card className="items-center py-10">
              <Text className="text-lg font-medium text-slate-500">
                Không có đơn hàng phù hợp
              </Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

export default TeamListScreen;
