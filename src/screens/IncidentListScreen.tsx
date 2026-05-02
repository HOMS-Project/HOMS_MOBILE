import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
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
import EmptyState from "../components/ui/EmptyState";
import { showToast } from "../utils/toast";
import {
  fetchMyIncidents,
  type StaffIncident,
} from "../services/staffFeatureService";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type StatusFilter = "ALL" | "Open" | "Investigating" | "Resolved" | "Dismissed";
type TypeFilter = "ALL" | "Damage" | "Delay" | "Accident" | "Loss" | "Other";

const filterLabel = (filter: StatusFilter | TypeFilter) => {
  if (filter === "ALL") return "Tất cả";
  if (filter === "Open") return "Mở";
  if (filter === "Investigating") return "Đang xử lý";
  if (filter === "Resolved") return "Đã giải quyết";
  if (filter === "Dismissed") return "Đã đóng";
  if (filter === "Damage") return "Hư hỏng";
  if (filter === "Delay") return "Trễ giờ";
  if (filter === "Accident") return "Tai nạn";
  if (filter === "Loss") return "Mất mát";
  if (filter === "Other") return "Khác";
  return filter;
};

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
  return "bg-emerald-100 text-emerald-700";
};

const isVideo = (url: string) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);

const IncidentListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incidents, setIncidents] = useState<StaffIncident[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  const closePreview = () => setPreviewImage(null);

  const filteredIncidents = incidents.filter((incident) => {
    const statusOk = statusFilter === "ALL" || incident.status === statusFilter;
    const typeOk = typeFilter === "ALL" 
      ? true 
      : typeFilter === "Other"
        ? !["Damage", "Delay", "Accident", "Loss"].includes(incident.type)
        : incident.type === typeFilter;
    const searchOk = incident.invoiceCode?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     (searchQuery === "");
    return statusOk && typeOk && searchOk;
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

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
          paddingBottom: 32,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </Pressable>
          <Text className="flex-1 text-xl font-extrabold text-slate-900">
            Báo cáo sự cố
          </Text>
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm"
            onPress={() => setShowFilters((prev) => !prev)}
          >
            <Ionicons
              name={showFilters ? "close" : "options-outline"}
              size={20}
              color="#0f172a"
            />
          </Pressable>
          <Pressable
            className="rounded-full border border-emerald-700 bg-emerald-600 px-3 py-1 shadow-sm"
            onPress={() => navigation.navigate("CreateIncident")}
          >
            <Text className="text-sm font-extrabold text-white">
              Tạo báo cáo
            </Text>
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
          <Card className="mt-4 rounded-[24px] p-5">
            <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Trạng thái
            </Text>
            <View className="mt-2 flex-row flex-wrap">
              {(
                ["ALL", "Open", "Investigating", "Resolved", "Dismissed"] as const
              ).map((s) => (
                <Pressable
                  key={s}
                  className={`mb-2 mr-2 rounded-full border px-3 py-1.5 ${statusFilter === s ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text
                    className={`text-sm font-bold ${statusFilter === s ? "text-emerald-700" : "text-slate-600"}`}
                  >
                    {filterLabel(s)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mt-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Loại sự cố
            </Text>
            <View className="mt-2 flex-row flex-wrap">
              {(
                ["ALL", "Damage", "Delay", "Accident", "Loss", "Other"] as const
              ).map((t) => (
                <Pressable
                  key={t}
                  className={`mb-2 mr-2 rounded-full border px-3 py-1.5 ${typeFilter === t ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}
                  onPress={() => setTypeFilter(t)}
                >
                  <Text
                    className={`text-sm font-bold ${typeFilter === t ? "text-emerald-700" : "text-slate-600"}`}
                  >
                    {filterLabel(t)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}

        <View className="mt-5 gap-3">
          {filteredIncidents.map((incident) => {
            const reportTime = incident.createdAt
              ? new Date(incident.createdAt).toLocaleString("vi-VN")
              : "Không rõ";
            const mediaList = Array.isArray(incident.images)
              ? incident.images.filter((item) => Boolean(item))
              : [];

            return (
              <Card key={incident.id} className="rounded-2xl p-4">
                <View className="flex-row items-start justify-between">
                  <View className="mr-2 flex-1">
                    <Text className="text-base font-bold text-slate-900">
                      {incident.invoiceCode || "Chưa có mã đơn"}
                    </Text>
                    <Text className="mt-0.5 text-sm text-slate-500">
                      {reportTime}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${statusClass(incident.status)}`}
                  >
                    <Text className="text-[11px] font-bold">
                      {statusLabel(incident.status)}
                    </Text>
                  </View>
                </View>

                <View className="mt-2.5 flex-row items-center gap-2">
                  <View className="rounded-full bg-emerald-100/80 px-3 py-1">
                    <Text className="text-[11px] font-bold text-slate-700">
                      {typeLabel(incident.type)}
                    </Text>
                  </View>
                </View>

                <View className="mt-3.5 p-1">
                  {mediaList.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8, paddingRight: 2 }}
                    >
                      {mediaList.map((mediaUrl, index) =>
                        isVideo(mediaUrl) ? (
                          <View
                            key={`${incident.id}-media-${index}`}
                            className="h-24 w-28 items-center justify-center rounded-xl border border-slate-100"
                          >
                            <Ionicons
                              name="videocam"
                              size={24}
                              color="#334155"
                            />
                            <Text className="mt-1 text-sm font-medium text-slate-600">
                              Video
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            key={`${incident.id}-media-${index}`}
                            className="h-24 w-24 overflow-hidden rounded-xl border border-slate-100 bg-white"
                            onPress={() => setPreviewImage(mediaUrl)}
                          >
                            <Image
                              source={{ uri: mediaUrl }}
                              className="h-full w-full rounded-lg"
                              resizeMode="contain"
                            />
                          </Pressable>
                        ),
                      )}
                    </ScrollView>
                  ) : (
                    <View className="h-20 items-center justify-center rounded-xl bg-slate-200">
                      <Text className="text-xs font-medium text-slate-500">
                        Chưa có media
                      </Text>
                    </View>
                  )}

                  <Text
                    className="mt-2.5 text-sm leading-6 text-slate-600"
                    numberOfLines={3}
                  >
                    {incident.description || "Chưa có ghi chú"}
                  </Text>
                </View>
              </Card>
            );
          })}

          {filteredIncidents.length === 0 ? (
            <View className="items-center py-10">
              <Ionicons name="shield-checkmark-outline" size={48} color="#94a3b8" />
              <Text className="mt-3 text-base font-semibold text-slate-500">
                Không có sự cố nào
              </Text>
              <Text className="mt-1 px-6 text-center text-sm text-slate-400">
                Không tìm thấy báo cáo sự cố nào phù hợp với bộ lọc của bạn.
              </Text>
              <Pressable
                className="mt-5 rounded-full bg-emerald-600 px-6 py-2.5"
                onPress={() => navigation.navigate("CreateIncident")}
              >
                <Text className="text-sm font-bold text-white">+ Tạo báo cáo mới</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(previewImage)}
        transparent
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View className="flex-1 items-center justify-center bg-black/85 px-4">
          <Pressable className="absolute inset-0" onPress={closePreview} />

          {previewImage ? (
            <Image
              source={{ uri: previewImage }}
              resizeMode="contain"
              style={{ width: "100%", height: 460 }}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

export default IncidentListScreen;
