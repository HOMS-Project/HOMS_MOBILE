import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  RefreshControl,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
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

const SkeletonTeamDetail = () => {
  const opacity = useSharedValue(0.4);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 600 }),
        withTiming(0.4, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={animatedStyle} className="flex-1 bg-[#edf4ef] p-4 pt-10">
      <View className="flex-row items-center mb-10">
         <View className="h-9 w-9 rounded-full bg-white opacity-60 mr-4" />
         <View className="h-8 w-48 rounded-xl bg-slate-200 opacity-50" />
      </View>
      <View className="h-44 w-full rounded-2xl bg-white opacity-60 mb-4" />
      <View className="h-32 w-full rounded-2xl bg-white opacity-60 mb-4" />
      <View className="h-48 w-full rounded-2xl bg-white opacity-60 mb-4" />
    </Animated.View>
  );
};

const TeamDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<TeamDetailRoute>();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<TeamDetail | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showAssistants, setShowAssistants] = useState(true);

  const invoiceId = route.params?.invoiceId;

  const fetchDetail = useCallback(async () => {
    try {
      const data = await fetchTeamOrderDetail(invoiceId);
      setDetail(data);
      // Forced delay for skeleton effect (300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error: any) {
      console.error("Fetch team detail failed:", error);
      showToast(error?.message || "Không thể tải thông tin đội");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [invoiceId]);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    await fetchDetail();
  }, [fetchDetail]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [invoiceId]),
  );

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
      className="mb-2 p-1"
    >
      <View className="flex-row items-center gap-3">
        {member.avatar ? (
          <Image
            source={{ uri: member.avatar }}
            className="h-9 w-9 rounded-full bg-slate-200"
            resizeMode="cover"
          />
        ) : (
          <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald-500">
            <Text className="text-sm font-extrabold text-white">
              {(member.fullName?.[0] || "U").toUpperCase()}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900">
            {member.fullName}
            {member.isCurrentUser ? " (bạn)" : ""}
          </Text>
          <Text className="text-sm text-slate-500">
            {member.phone || "Chưa có số điện thoại"}
          </Text>
        </View>

        <Pressable
          className={`h-8 w-8 items-center justify-center rounded-full ${member.phone ? "bg-emerald-500" : "bg-slate-200"}`}
          disabled={!member.phone}
          onPress={() => handleCallMember(member.phone)}
        >
          <Ionicons
            name="call"
            size={16}
            color={member.phone ? "#fff" : "#64748b"}
          />
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return <SkeletonTeamDetail />;
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
        contentContainerStyle={{
          padding: 16,
          paddingTop: 32,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row items-center">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </Pressable>
          <Text className="ml-3 flex-1 text-xl font-extrabold text-slate-900">
            Chi tiết đội
          </Text>
        </View>

        <Card className="mt-4 rounded-2xl p-4">
          <View className="flex-row items-start justify-between">
            <View className="mr-2 flex-1">
              <Text className="text-xl font-bold text-slate-900">
                {detail.orderCode}
              </Text>
              <Text className="mt-0.5 text-sm text-slate-500">{dateText}</Text>
            </View>

            <Pressable
              className="rounded-full bg-emerald-100 px-3 py-1.5"
              onPress={() =>
                navigation.navigate("OrderDetails", {
                  invoiceId: detail.invoiceId || invoiceId,
                })
              }
            >
              <Text className="text-xs font-bold text-emerald-700">
                Xem đơn hàng
              </Text>
            </Pressable>
          </View>

          <View className="mt-2.5 self-start rounded-full bg-slate-50 px-3 py-1">
            <Text className="text-[11px] font-bold text-emerald-700">
              {statusLabel(detail.status)}
            </Text>
          </View>

          <View className="mt-4 gap-2.5 p-1">
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={9} color="#2563eb" />
              <Text className="flex-1 text-sm font-medium text-slate-700">
                {detail.pickupAddress || "Chưa có điểm nhận"}
              </Text>
            </View>
            <View className="ml-1 h-4 w-px bg-slate-300" />
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={9} color="#ef4444" />
              <Text className="flex-1 text-sm font-medium text-slate-700">
                {detail.deliveryAddress || "Chưa có điểm giao"}
              </Text>
            </View>
          </View>
        </Card>

        <Card className="mt-4 rounded-2xl p-4">
          <View className="mb-3 flex-row items-center gap-2">
            <Ionicons name="car-outline" size={18} color="#0f766e" />
            <Text className="text-lg font-extrabold text-slate-900">
              Xe phân công
            </Text>
          </View>

          {detail.vehicle ? (
            <View className="p-1">
              <Text className="text-lg font-bold text-slate-900">
                {detail.vehicle.plateNumber || "Chưa có biển số"}
              </Text>
              <Text className="mt-0.5 text-sm text-slate-500">
                {detail.vehicle.vehicleType || "Chưa có loại xe"}
              </Text>
            </View>
          ) : (
            <View className="p-1">
              <Text className="text-sm text-slate-500">
                Chưa có thông tin xe
              </Text>
            </View>
          )}
        </Card>

        <Card className="mt-4 rounded-2xl p-4">
          <Pressable
            className="flex-row items-center justify-between"
            onPress={() => setShowDrivers((prev) => !prev)}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="person-outline" size={18} color="#0f766e" />
              <Text className="text-lg font-extrabold text-slate-900">
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

        <Card className="mt-4 rounded-2xl p-4">
          <Pressable
            className="flex-row items-center justify-between"
            onPress={() => setShowAssistants((prev) => !prev)}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="people-outline" size={18} color="#0f766e" />
              <Text className="text-lg font-extrabold text-slate-900">
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
