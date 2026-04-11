import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { showToast } from "../utils/toast";
import {
  fetchMyIncidents,
  type StaffIncident,
} from "../services/staffFeatureService";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const typeLabel = (type: string) => {
  if (type === "Damage") return "Hư hỏng";
  if (type === "Delay") return "Trễ giờ";
  if (type === "Accident") return "Tai nạn";
  if (type === "Loss") return "Mất mát";
  return "Khác";
};

const statusLabel = (status: string) => {
  if (status === "Open") return "Mở";
  if (status === "Investigating") return "Đang xử lý";
  if (status === "Resolved") return "Đã giải quyết";
  if (status === "Dismissed") return "Đã đóng";
  return status;
};

const statusClass = (status: string) => {
  if (status === "Open") return "bg-amber-100 text-amber-700";
  if (status === "Investigating") return "bg-sky-100 text-sky-700";
  if (status === "Resolved") return "bg-emerald-100 text-emerald-700";
  if (status === "Dismissed") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-600";
};

const isVideo = (url: string) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);

const IncidentListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incidents, setIncidents] = useState<StaffIncident[]>([]);

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await fetchMyIncidents();
      setIncidents(data);
    } catch (error: any) {
      console.error("Fetch incidents failed:", error);
      showToast(error?.message || "Không thể tải báo cáo sự cố");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchIncidents();
    }, [fetchIncidents]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchIncidents();
  };

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
        contentContainerStyle={{ padding: 20, paddingBottom: 42 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </Pressable>
          <Text className="flex-1 text-2xl font-extrabold text-slate-900">
            Báo cáo sự cố
          </Text>
        </View>

        <Card className="mt-5 rounded-[24px] p-5">
          <Button
            title="Tạo báo cáo"
            onPress={() => navigation.navigate("CreateIncident")}
            className="h-12"
          />
        </Card>

        <View className="mt-5 gap-3">
          {incidents.map((incident) => {
            const reportTime = incident.createdAt
              ? new Date(incident.createdAt).toLocaleString("vi-VN")
              : "Không rõ";
            const firstMedia = incident.images?.[0] || "";

            return (
              <Card key={incident.id} className="rounded-[24px] p-5">
                <View className="flex-row items-start justify-between">
                  <View className="mr-3 flex-1">
                    <Text className="text-base font-bold text-slate-900">
                      {incident.invoiceCode || "Chưa có mã đơn"}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-500">
                      {reportTime}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${statusClass(incident.status)}`}
                  >
                    <Text className="text-xs font-bold">
                      {statusLabel(incident.status)}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center gap-2">
                  <View className="rounded-full bg-slate-100 px-3 py-1">
                    <Text className="text-xs font-bold text-slate-700">
                      {typeLabel(incident.type)}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 rounded-2xl bg-slate-50 p-3">
                  {firstMedia ? (
                    isVideo(firstMedia) ? (
                      <View className="h-28 items-center justify-center rounded-xl bg-slate-200">
                        <Ionicons name="videocam" size={28} color="#334155" />
                        <Text className="mt-2 text-xs font-medium text-slate-600">
                          Video minh chứng
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: firstMedia }}
                        className="h-28 w-full rounded-xl bg-slate-200"
                        resizeMode="cover"
                      />
                    )
                  ) : (
                    <View className="h-20 items-center justify-center rounded-xl bg-slate-200">
                      <Text className="text-xs font-medium text-slate-500">
                        Chưa có media
                      </Text>
                    </View>
                  )}

                  <Text
                    className="mt-3 text-sm leading-5 text-slate-600"
                    numberOfLines={2}
                  >
                    {incident.description || "Chưa có ghi chú"}
                  </Text>
                </View>
              </Card>
            );
          })}

          {incidents.length === 0 ? (
            <Card className="items-center py-10">
              <Text className="text-base font-medium text-slate-500">
                Bạn chưa có báo cáo sự cố nào
              </Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

export default IncidentListScreen;
