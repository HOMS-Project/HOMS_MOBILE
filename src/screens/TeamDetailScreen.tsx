import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import Card from "../components/ui/Card";
import { showToast } from "../utils/toast";
import {
  fetchTeamOrderDetail,
  type TeamDetail,
  type TeamMember,
} from "../services/staffFeatureService";

type TeamDetailRoute = RouteProp<RootStackParamList, "TeamDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusLabel = (status: string) => {
  if (status === "IN_PROGRESS") return "Đang thực hiện";
  if (status === "ACCEPTED") return "Đã nhận";
  if (status === "COMPLETED") return "Đã hoàn tất";
  if (status === "ASSIGNED") return "Đã phân công";
  if (status === "CANCELLED") return "Đã hủy";
  return status || "Không rõ";
};

const TeamDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<TeamDetailRoute>();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<TeamDetail | null>(null);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showAssistants, setShowAssistants] = useState(true);

  const invoiceId = route.params?.invoiceId;

  const fetchDetail = async () => {
    try {
      const data = await fetchTeamOrderDetail(invoiceId);
      setDetail(data);
    } catch (error: any) {
      console.error("Fetch team detail failed:", error);
      showToast(error?.message || "Không thể tải thông tin đội");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [invoiceId]);

  const handleCallMember = (phone: string) => {
    if (!phone) {
      showToast("Thành viên chưa có số điện thoại");
      return;
    }

    Alert.alert("Gọi thành viên", `Bạn có muốn gọi ${phone} không?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Gọi",
        onPress: async () => {
          try {
            const telUrl = `tel:${phone.replace(/[^\\d+]/g, "")}`;
            const canOpen = await Linking.canOpenURL(telUrl);
            if (!canOpen) {
              showToast("Thiết bị không hỗ trợ gọi điện");
              return;
            }
            await Linking.openURL(telUrl);
          } catch (error) {
            console.error("Call member failed:", error);
            showToast("Không thể mở ứng dụng gọi điện");
          }
        },
      },
    ]);
  };

  const renderMember = (member: TeamMember, roleKey: string, index: number) => (
    <View
      key={`${roleKey}-${member.id || member.fullName}-${index}`}
      className="mb-3 rounded-2xl bg-emerald-50/50 p-4"
    >
      <View className="flex-row items-center gap-3">
        {member.avatar ? (
          <Image
            source={{ uri: member.avatar }}
            className="h-11 w-11 rounded-full bg-slate-200"
            resizeMode="cover"
          />
        ) : (
          <View className="h-11 w-11 items-center justify-center rounded-full bg-emerald-500">
            <Text className="text-base font-extrabold text-white">
              {(member.fullName?.[0] || "U").toUpperCase()}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            {member.fullName}
            {member.isCurrentUser ? " (bạn)" : ""}
          </Text>
          <Text className="text-base text-slate-500">
            {member.phone || "Chưa có số điện thoại"}
          </Text>
        </View>

        <Pressable
          className={`h-10 w-10 items-center justify-center rounded-full ${member.phone ? "bg-emerald-500" : "bg-slate-200"}`}
          disabled={!member.phone}
          onPress={() => handleCallMember(member.phone)}
        >
          <Ionicons
            name="call"
            size={18}
            color={member.phone ? "#fff" : "#64748b"}
          />
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#edf4ef]">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-100/70 px-6">
        <Text className="text-center text-base font-medium text-slate-500">
          Không thể tải thông tin đội
        </Text>
      </View>
    );
  }

  const dateText = detail.scheduledTime
    ? `${new Date(detail.scheduledTime).toLocaleDateString("vi-VN")} · ${new Date(
        detail.scheduledTime,
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Chưa có lịch";

  return (
    <View className="flex-1 bg-[#edf4ef]">
      <View className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/35" />
      <View className="absolute -left-16 bottom-14 h-56 w-56 rounded-full bg-sky-200/40" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </Pressable>
          <Text className="ml-3 flex-1 text-3xl font-extrabold text-slate-900">
            Chi tiết đội
          </Text>
        </View>

        <Card className="mt-5 rounded-[24px] p-6">
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <Text className="text-2xl font-bold text-slate-900">
                {detail.orderCode}
              </Text>
              <Text className="mt-1 text-base text-slate-500">{dateText}</Text>
            </View>

            <Pressable
              className="rounded-full bg-emerald-100 px-4 py-2"
              onPress={() =>
                navigation.navigate("OrderList", { fromTeamDetail: true })
              }
            >
              <Text className="text-base font-bold text-emerald-700">
                Xem đơn hàng
              </Text>
            </Pressable>
          </View>

          <View className="mt-3 self-start rounded-full bg-emerald-50 px-4 py-2">
            <Text className="text-sm font-bold text-emerald-700">
              {statusLabel(detail.status)}
            </Text>
          </View>

          <View className="mt-4 gap-2 rounded-2xl bg-emerald-50/50 p-4">
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={10} color="#2563eb" />
              <Text className="flex-1 text-base font-medium text-slate-700">
                {detail.pickupAddress || "Chưa có điểm nhận"}
              </Text>
            </View>
            <View className="ml-1 h-4 w-px bg-slate-300" />
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={10} color="#ef4444" />
              <Text className="flex-1 text-base font-medium text-slate-700">
                {detail.deliveryAddress || "Chưa có điểm giao"}
              </Text>
            </View>
          </View>
        </Card>

        <Card className="mt-4 rounded-[24px] p-6">
          <View className="mb-3 flex-row items-center gap-2">
            <Ionicons name="car-outline" size={20} color="#0f766e" />
            <Text className="text-2xl font-extrabold text-slate-900">
              Xe phân công
            </Text>
          </View>

          {detail.vehicle ? (
            <View className="rounded-2xl bg-emerald-50/50 p-4">
              <Text className="text-2xl font-bold text-slate-900">
                {detail.vehicle.plateNumber || "Chưa có biển số"}
              </Text>
              <Text className="mt-1 text-base text-slate-500">
                {detail.vehicle.vehicleType || "Chưa có loại xe"}
              </Text>
            </View>
          ) : (
            <View className="rounded-2xl bg-emerald-50/50 p-4">
              <Text className="text-base text-slate-500">
                Chưa có thông tin xe
              </Text>
            </View>
          )}
        </Card>

        <Card className="mt-4 rounded-[24px] p-6">
          <Pressable
            className="flex-row items-center justify-between"
            onPress={() => setShowDrivers((prev) => !prev)}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="person-outline" size={20} color="#0f766e" />
              <Text className="text-2xl font-extrabold text-slate-900">
                Tài xế ({detail.drivers.length})
              </Text>
            </View>
            <Ionicons
              name={showDrivers ? "chevron-up" : "chevron-down"}
              size={20}
              color="#0f172a"
            />
          </Pressable>

          {showDrivers ? (
            <View className="mt-4">
              {detail.drivers.length > 0 ? (
                detail.drivers.map((member, index) =>
                  renderMember(member, "driver", index),
                )
              ) : (
                <Text className="text-sm text-slate-500">
                  Không có tài xế trong đội
                </Text>
              )}
            </View>
          ) : null}
        </Card>

        <Card className="mt-4 rounded-[24px] p-6">
          <Pressable
            className="flex-row items-center justify-between"
            onPress={() => setShowAssistants((prev) => !prev)}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="people-outline" size={20} color="#0f766e" />
              <Text className="text-2xl font-extrabold text-slate-900">
                Nhân viên phụ trợ ({detail.assistants.length})
              </Text>
            </View>
            <Ionicons
              name={showAssistants ? "chevron-up" : "chevron-down"}
              size={20}
              color="#0f172a"
            />
          </Pressable>

          {showAssistants ? (
            <View className="mt-4">
              {detail.assistants.length > 0 ? (
                detail.assistants.map((member, index) =>
                  renderMember(member, "assistant", index),
                )
              ) : (
                <Text className="text-sm text-slate-500">
                  Không có nhân viên phụ trợ
                </Text>
              )}
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </View>
  );
};

export default TeamDetailScreen;
