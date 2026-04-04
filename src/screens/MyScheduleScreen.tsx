import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { showToast } from "../utils/toast";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Job = {
  id: string;
  invoiceId: string;
  assignmentId?: string;
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
    case "IN_PROGRESS":
      return "bg-sky-100 text-sky-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "ASSIGNED":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Đã hoàn tất";
    case "IN_PROGRESS":
      return "Đang thực hiện";
    case "PENDING":
      return "Chờ xử lý";
    case "ASSIGNED":
      return "Đã phân công";
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

  const fetchJobs = useCallback(async () => {
    try {
      const result = await staffApi.getOrders();
      const payload = (result as any)?.data ?? result;

      const formattedJobs = (payload || [])
        .filter((o: any) => (o.status || "").toUpperCase() === "ASSIGNED")
        .map((o: any) => ({
          id: o.invoiceId,
          invoiceId: o.invoiceId,
          assignmentId: o.assignmentId,
          date: o.scheduledTime
            ? new Date(o.scheduledTime).toLocaleDateString()
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
    }, [fetchJobs]),
  );

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

  const upcoming = jobs.filter((j) => j.status !== "COMPLETED");
  const completed = jobs.filter((j) => j.status === "COMPLETED");

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100">
      <View className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/35" />
      <View className="absolute -left-16 bottom-14 h-56 w-56 rounded-full bg-sky-200/40" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm"
            onPress={() => navigation.navigate("MainTabs")}
          >
            <Ionicons name="chevron-back" size={22} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-extrabold text-slate-900">
            Lịch của tôi
          </Text>
          <View className="h-11 w-11" />
        </View>

        <Card className="mt-6 rounded-[28px] border-emerald-100 bg-emerald-50/80 p-5">
          <Text className="text-sm font-semibold text-emerald-700">
            Công việc hôm nay
          </Text>
          <Text className="mt-1 text-3xl font-extrabold text-slate-900">
            {upcoming.length}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            đơn hàng đang chờ bạn xác nhận
          </Text>
        </Card>

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
                      <Text className="text-xl">📦</Text>
                      <Text className="text-base font-bold text-slate-800">
                        {item.invoice}
                      </Text>
                    </View>
                    <Text className="mt-1 text-sm text-slate-500">
                      {item.date}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${getStatusStyle(item.status)}`}
                  >
                    <Text className="text-xs font-bold">
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                <View className="gap-3 rounded-2xl bg-slate-50 p-3">
                  <View className="flex-row items-start gap-2">
                    <Ionicons name="ellipse" size={10} color="#2563eb" />
                    <View className="flex-1">
                      <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {item.pickup.title}
                      </Text>
                      <Text
                        className="text-sm font-medium text-slate-700"
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
                      <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {item.dropoff.title}
                      </Text>
                      <Text
                        className="text-sm font-medium text-slate-700"
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
                    className="h-12"
                  />
                ) : null}
              </Card>
            </Pressable>
          ))
        ) : (
          <Card className="items-center py-10">
            <Text className="text-sm font-medium text-slate-500">
              Không có công việc sắp tới
            </Text>
          </Card>
        )}

        {completed.length > 0 ? (
          <>
            <Section title="Đơn hoàn tất gần đây" />
            {completed.map((item) => (
              <Pressable
                key={item.id}
                className="mb-3"
                onPress={() =>
                  navigation.navigate("OrderDetails", {
                    invoiceId: item.invoiceId,
                  })
                }
              >
                <Card className="rounded-[24px] p-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-slate-800">
                      {item.invoice}
                    </Text>
                    <Text className="text-xs font-semibold text-emerald-700">
                      Hoàn tất
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default MyScheduleScreen;
