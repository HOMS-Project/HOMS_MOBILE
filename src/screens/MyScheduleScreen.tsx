import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { staffApi } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Section from "../components/ui/Section";
import EmptyState from "../components/ui/EmptyState";
import { showToast } from "../utils/toast";
import { useTabBar } from "../contexts/TabBarContext";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Job = {
  id: string;
  invoiceId: string;
  assignmentId?: string;
  scheduledTime?: string;
  date: string;
  invoice: string;
  status: string;
  pickup: { title: string; address: string };
  dropoff: { title: string; address: string };
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "ACCEPTED":
      return "bg-cyan-100 text-cyan-700";
    case "IN_PROGRESS":
      return "bg-sky-100 text-sky-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "ASSIGNED":
      return "bg-violet-100 text-violet-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Đã hoàn tất";
    case "ACCEPTED":
      return "Đã nhận";
    case "IN_PROGRESS":
      return "Đang thực hiện";
    case "PENDING":
      return "Chờ xử lý";
    case "ASSIGNED":
      return "Đã phân công";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
};

const MyScheduleScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // ── Tab bar visibility (Grab-style) ────────────────────────────────
  const { setTabBarVisible } = useTabBar();
  const lastScrollY = useRef(0);
  const scrollDir = useRef<"up" | "down">("up");

  const fetchJobs = useCallback(async () => {
    try {
      const result = await staffApi.getOrders();
      const payload = (result as any)?.data ?? result;

      const formattedJobs = (payload || []).map((o: any) => ({
        id: o.invoiceId || o._id,
        invoiceId: o.invoiceId || o._id,
        assignmentId: o.assignmentId,
        scheduledTime: o.scheduledTime || "",
        date: o.scheduledTime
          ? new Date(o.scheduledTime).toLocaleDateString("vi-VN")
          : "",
        invoice: o.orderCode,
        status: (o.status || "").toUpperCase(),
        pickup: {
          title: o.pickup?.address?.split(",")[0] || "Điểm lấy",
          address: o.pickup?.address || "",
        },
        dropoff: {
          title: o.delivery?.address?.split(",")[0] || "Điểm giao",
          address: o.delivery?.address || "",
        },
      }));

      setJobs(formattedJobs);
    } catch (error: any) {
      console.error("Fetch jobs failed:", error);
      showToast(error?.message || "Không thể tải lịch làm việc");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
      setTabBarVisible(true);
      lastScrollY.current = 0;
      scrollDir.current = "up";
      return () => { setTabBarVisible(true); };
    }, [fetchJobs, setTabBarVisible]),
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastScrollY.current;
    lastScrollY.current = y;
    if (Math.abs(dy) < 4) return;
    const dir = dy > 0 ? "down" : "up";
    if (dir !== scrollDir.current) {
      scrollDir.current = dir;
      setTabBarVisible(dir === "up");
    }
  };

  const handleAccept = async (job: Job) => {
    setAcceptingId(job.id);
    try {
      if (!job.assignmentId) {
        throw new Error("Thiếu mã phân công");
      }
      await staffApi.updateAssignmentStatus(job.assignmentId, "ACCEPTED");
      showToast("Đã nhận đơn thành công");
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      navigation.navigate("OrderList");
    } catch (error: any) {
      console.error("Accept job failed:", error);
      showToast(error?.message || "Không thể nhận đơn");
    } finally {
      setAcceptingId(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const todayJobs = jobs
    .filter((j) => {
      const ts = new Date(j.scheduledTime || "").getTime();
      return (
        !Number.isNaN(ts) &&
        ts >= startOfToday.getTime() &&
        ts <= endOfToday.getTime()
      );
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledTime || "").getTime() -
        new Date(b.scheduledTime || "").getTime(),
    );

  const upcoming = jobs
    .filter((j) => {
      const ts = new Date(j.scheduledTime || "").getTime();
      if (Number.isNaN(ts)) return false;
      return (
        ts >= startOfToday.getTime() &&
        !["COMPLETED", "CANCELLED"].includes(j.status)
      );
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledTime || "").getTime() -
        new Date(b.scheduledTime || "").getTime(),
    );

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
          padding: 20,
          paddingTop: 42,
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row items-center">
          <Text className="text-[34px] font-extrabold text-slate-900">
            Lịch của tôi
          </Text>
        </View>

        <View className="mt-6">
          <Text className="mb-3 text-lg font-bold text-slate-900">Công việc hôm nay</Text>
          {todayJobs.length > 0 ? (
            todayJobs.map((item) => (
              <Pressable
                key={item.id}
                className="mb-3"
                onPress={() =>
                  navigation.navigate("OrderDetails", {
                    invoiceId: item.invoiceId,
                  })
                }
              >
                <Card className="gap-4 rounded-[26px] border-emerald-200 bg-emerald-50/80 p-5">
                  <View className="flex-row items-start justify-between">
                    <View className="mr-3 flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">📋</Text>
                        <Text className="text-xl font-bold text-slate-800">
                          {item.invoice}
                        </Text>
                      </View>
                      <Text className="mt-1 text-base text-slate-500">
                        {item.date}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-4 py-2 ${getStatusStyle(item.status)}`}
                    >
                      <Text className="text-sm font-bold">
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>

                  <View className="gap-3 rounded-2xl border border-emerald-100 bg-white p-3">
                    <View className="flex-row items-start gap-2">
                      <Ionicons name="ellipse" size={10} color="#2563eb" />
                      <View className="flex-1">
                        <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">
                          {item.pickup.title}
                        </Text>
                        <Text
                          className="text-base font-medium text-slate-700"
                          numberOfLines={1}
                        >
                          {item.pickup.address}
                        </Text>
                      </View>
                    </View>

                    <View className="ml-1 h-4 w-px bg-slate-300" />

                    <View className="flex-row items-start gap-2">
                      <Ionicons name="ellipse" size={10} color="#ef4444" />
                      <View className="flex-1">
                        <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">
                          {item.dropoff.title}
                        </Text>
                        <Text
                          className="text-base font-medium text-slate-700"
                          numberOfLines={1}
                        >
                          {item.dropoff.address}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {item.status === "ASSIGNED" ? (
                    <Button
                      title="Nhận đơn"
                      onPress={() => handleAccept(item)}
                      loading={acceptingId === item.id}
                      disabled={acceptingId === item.id}
                      className="h-14"
                    />
                  ) : null}
                </Card>
              </Pressable>
            ))
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="Hôm nay thảnh thơi"
              description="Bạn không có đơn hàng nào được lên lịch trong hôm nay."
              className="mt-0"
            />
          )}
        </View>


        <Section title="Sắp tới" />

        {upcoming.length > 0 ? (
          upcoming.map((item) => (
            <Pressable
              key={item.id}
              className="mb-3"
              onPress={() =>
                navigation.navigate("OrderDetails", {
                  invoiceId: item.invoiceId,
                })
              }
            >
              <Card className="gap-4 rounded-[26px] p-5">
                <View className="flex-row items-start justify-between">
                  <View className="mr-3 flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">📦</Text>
                      <Text className="text-xl font-bold text-slate-800">
                        {item.invoice}
                      </Text>
                    </View>
                    <Text className="mt-1 text-base text-slate-500">
                      {item.date}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-4 py-2 ${getStatusStyle(item.status)}`}
                  >
                    <Text className="text-sm font-bold">
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                <View className="gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                  <View className="flex-row items-start gap-2">
                    <Ionicons name="ellipse" size={10} color="#2563eb" />
                    <View className="flex-1">
                      <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        {item.pickup.title}
                      </Text>
                      <Text
                        className="text-base font-medium text-slate-700"
                        numberOfLines={1}
                      >
                        {item.pickup.address}
                      </Text>
                    </View>
                  </View>

                  <View className="ml-1 h-4 w-px bg-slate-300" />

                  <View className="flex-row items-start gap-2">
                    <Ionicons name="ellipse" size={10} color="#ef4444" />
                    <View className="flex-1">
                      <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        {item.dropoff.title}
                      </Text>
                      <Text
                        className="text-base font-medium text-slate-700"
                        numberOfLines={1}
                      >
                        {item.dropoff.address}
                      </Text>
                    </View>
                  </View>
                </View>

                {item.status === "ASSIGNED" ? (
                  <Button
                    title="Nhận đơn"
                    onPress={() => handleAccept(item)}
                    loading={acceptingId === item.id}
                    disabled={acceptingId === item.id}
                    className="h-14"
                  />
                ) : null}
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState
            icon="time-outline"
            title="Chưa có lịch mới"
            description="Lịch làm việc sắp tới sẽ xuất hiện tại đây khi được phân công."
          />
        )}
      </ScrollView>
    </View>
  );
};

export default MyScheduleScreen;
