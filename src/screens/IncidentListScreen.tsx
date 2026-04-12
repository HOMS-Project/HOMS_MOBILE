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
  return "bg-emerald-100 text-emerald-700";
};

const isVideo = (url: string) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);

const IncidentListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incidents, setIncidents] = useState<StaffIncident[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        contentContainerStyle={{ padding: 20, paddingBottom: 42 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </Pressable>
          <Text className="flex-1 text-2xl font-extrabold text-slate-900">
            Báo cáo sự cố
          </Text>
        </View>

        <Card className="mt-5 self-center rounded-[24px] px-3 py-2">
          <Button
            title="Tạo báo cáo"
            onPress={() => navigation.navigate("CreateIncident")}
            className="h-10 px-6"
            textClassName="text-base"
          />
        </Card>

        <View className="mt-5 gap-3">
          {incidents.map((incident) => {
            const reportTime = incident.createdAt
              ? new Date(incident.createdAt).toLocaleString("vi-VN")
              : "Không rõ";
            const mediaList = Array.isArray(incident.images)
              ? incident.images.filter((item) => Boolean(item))
              : [];

            return (
              <Card key={incident.id} className="rounded-[24px] p-5">
                <View className="flex-row items-start justify-between">
                  <View className="mr-3 flex-1">
                    <Text className="text-xl font-bold text-slate-900">
                      {incident.invoiceCode || "Chưa có mã đơn"}
                    </Text>
                    <Text className="mt-1 text-lg text-slate-500">
                      {reportTime}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-4 py-1.5 ${statusClass(incident.status)}`}
                  >
                    <Text className="text-base font-bold">
                      {statusLabel(incident.status)}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center gap-2">
                  <View className="rounded-full bg-emerald-100/80 px-4 py-1.5">
                    <Text className="text-base font-bold text-slate-700">
                      {typeLabel(incident.type)}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 rounded-2xl bg-emerald-50/50 p-3">
                  {mediaList.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12, paddingRight: 2 }}
                    >
                      {mediaList.map((mediaUrl, index) =>
                        isVideo(mediaUrl) ? (
                          <View
                            key={`${incident.id}-media-${index}`}
                            className="h-32 w-32 items-center justify-center rounded-xl bg-slate-200"
                          >
                            <Ionicons
                              name="videocam"
                              size={34}
                              color="#334155"
                            />
                            <Text className="mt-1 text-sm font-medium text-slate-600">
                              Video
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            key={`${incident.id}-media-${index}`}
                            className="h-32 w-32 overflow-hidden rounded-xl bg-slate-200 p-1"
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
                    className="mt-3 text-lg leading-7 text-slate-600"
                    numberOfLines={3}
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
