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
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { apiRequest, endpoints } from "../api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

type OrderDetailsRouteProp = RouteProp<RootStackParamList, "OrderDetails">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type OrderDetail = {
  id: string;
  assignmentId: string;
  orderCode: string;
  status: string;
  pickup: { address: string; district: string };
  delivery: { address: string; district: string };
  items: { name: string; quantity: number; notes?: string }[];
  scheduledTime: string;
  dispatchTime?: string;
  customer?: {
    name?: string;
    phone?: string;
    phoneNumber?: string;
    email?: string;
    avatar?: string;
  };
  completionEvidence?: {
    beforeImages?: string[];
    afterImages?: string[];
    beforeNote?: string;
    afterNote?: string;
  };
};

const stripSecTag = (name?: string) => {
  if (!name) return "";
  return name.replace(/^\s*\[SEC:[^\]]+\]\s*/i, "").trim();
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Chưa xác định";
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()} ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const statusLabel = (status: string) => {
  if (status === "IN_PROGRESS") return "Đang thực hiện";
  if (status === "ACCEPTED") return "Đã nhận đơn";
  if (status === "COMPLETED") return "Đã hoàn tất";
  return status;
};

const statusClass = (status: string) => {
  if (status === "IN_PROGRESS") return "bg-sky-100 text-sky-700";
  if (status === "ACCEPTED") return "bg-amber-100 text-amber-700";
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-600";
};

const OrderDetailsScreen: React.FC = () => {
  const route = useRoute<OrderDetailsRouteProp>();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const fetchOrderDetails = async () => {
    const invoiceId = route.params?.invoiceId;
    if (!invoiceId || invoiceId === "undefined") {
      console.error("Invalid invoiceId provided to OrderDetailsScreen");
      setLoading(false);
      return;
    }

    try {
      const result = await apiRequest(
        endpoints.staff.getOrderDetails(invoiceId),
      );
      const payload = (result as any)?.data ?? result;
      if (payload) {
        setOrder({
          ...payload,
          items: Array.isArray(payload.items) ? payload.items : [],
          completionEvidence: {
            beforeImages: Array.isArray(
              payload?.completionEvidence?.beforeImages,
            )
              ? payload.completionEvidence.beforeImages
              : [],
            afterImages: Array.isArray(payload?.completionEvidence?.afterImages)
              ? payload.completionEvidence.afterImages
              : [],
            beforeNote:
              typeof payload?.completionEvidence?.beforeNote === "string"
                ? payload.completionEvidence.beforeNote
                : "",
            afterNote:
              typeof payload?.completionEvidence?.afterNote === "string"
                ? payload.completionEvidence.afterNote
                : "",
          },
        });
      }
    } catch (error) {
      console.error("Fetch order details failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100 px-6">
        <Text className="text-center text-base font-medium text-slate-500">
          Không thể tải thông tin đơn hàng
        </Text>
      </View>
    );
  }

  const customerName = order.customer?.name || "Khách hàng";
  const customerPhone =
    order.customer?.phone || order.customer?.phoneNumber || "";
  const customerAvatar = order.customer?.avatar || "";
  const items = Array.isArray(order.items) ? order.items : [];
  const beforeImages = Array.isArray(order.completionEvidence?.beforeImages)
    ? order.completionEvidence?.beforeImages
    : [];
  const afterImages = Array.isArray(order.completionEvidence?.afterImages)
    ? order.completionEvidence?.afterImages
    : [];
  const beforeNote = (order.completionEvidence?.beforeNote || "").trim();
  const afterNote = (order.completionEvidence?.afterNote || "").trim();

  const renderEvidenceList = (images: string[]) => {
    if (!images.length) {
      return (
        <View className="rounded-2xl bg-slate-50 px-4 py-3">
          <Text className="text-sm italic text-slate-500">Chưa có ảnh</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 6 }}
      >
        {images.map((uri, index) => (
          <Image
            key={`${uri}-${index}`}
            source={{ uri }}
            className="mr-3 h-28 w-28 rounded-2xl bg-slate-200"
            resizeMode="cover"
          />
        ))}
      </ScrollView>
    );
  };

  const handleContact = () => {
    if (!customerPhone) {
      Alert.alert(
        "Không có số điện thoại",
        "Khách hàng chưa cập nhật số điện thoại.",
      );
      return;
    }

    Alert.alert(
      "Yêu cầu gọi điện",
      `Bạn có muốn mở ứng dụng gọi điện với số ${customerPhone} không?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Gọi",
          onPress: async () => {
            try {
              const normalizedPhone = customerPhone.replace(/[^\d+]/g, "");
              const telUrl = `tel:${normalizedPhone}`;
              const canOpen = await Linking.canOpenURL(telUrl);

              if (!canOpen) {
                Alert.alert(
                  "Không thể gọi",
                  "Thiết bị không hỗ trợ mở ứng dụng gọi điện.",
                );
                return;
              }

              await Linking.openURL(telUrl);
            } catch (error) {
              console.error("Open dialer failed:", error);
              Alert.alert("Lỗi", "Không thể mở ứng dụng gọi điện.");
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-slate-100">
      <View className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/35" />
      <View className="absolute -left-16 bottom-14 h-56 w-56 rounded-full bg-sky-200/40" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center">
          <Pressable
            className="h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#0f172a" />
          </Pressable>
          <Text className="ml-3 text-[34px] font-extrabold text-slate-900">
            Chi tiết đơn hàng
          </Text>
        </View>

        <Card className="mt-6 items-center rounded-[28px] border-emerald-100 bg-emerald-50/80 p-7">
          <View
            className={`rounded-full px-4 py-2 ${statusClass(order.status)}`}
          >
            <Text className="text-base font-bold">
              {statusLabel(order.status)}
            </Text>
          </View>
          <Text className="mt-3 text-4xl font-extrabold tracking-wide text-slate-900">
            {order.orderCode}
          </Text>
        </Card>

        <Card className="mt-5 gap-4 rounded-[24px] p-6">
          <View className="flex-row items-start gap-3">
            <Ionicons name="calendar-outline" size={22} color="#0f766e" />
            <View className="flex-1">
              <Text className="text-base font-bold uppercase tracking-wide text-slate-500">
                Lịch hẹn khách hàng
              </Text>
              <Text className="mt-1 text-lg font-semibold text-slate-800">
                {formatDate(order.scheduledTime)}
              </Text>
            </View>
          </View>

          <View className="h-px bg-slate-100" />

          <View className="flex-row items-start gap-3">
            <Ionicons name="time-outline" size={22} color="#d97706" />
            <View className="flex-1">
              <Text className="text-base font-bold uppercase tracking-wide text-slate-500">
                Thời gian điều phối dự kiến
              </Text>
              <Text className="mt-1 text-lg font-semibold text-slate-800">
                {formatDate(order.dispatchTime || order.scheduledTime)}
              </Text>
            </View>
          </View>
        </Card>

        <Card className="mt-5 gap-4 rounded-[24px] p-6">
          <Text className="text-2xl font-extrabold text-slate-900">
            Lộ trình di chuyển
          </Text>

          <View className="gap-3 rounded-2xl bg-slate-50 p-4">
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={11} color="#2563eb" />
              <View className="flex-1">
                <Text className="text-base font-bold uppercase tracking-wide text-slate-500">
                  Điểm lấy
                </Text>
                <Text
                  className="text-lg font-medium text-slate-700"
                  numberOfLines={2}
                >
                  {order.pickup?.address}
                </Text>
              </View>
            </View>

            <View className="ml-1 h-4 w-px bg-slate-300" />

            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={11} color="#ef4444" />
              <View className="flex-1">
                <Text className="text-base font-bold uppercase tracking-wide text-slate-500">
                  Điểm giao
                </Text>
                <Text
                  className="text-lg font-medium text-slate-700"
                  numberOfLines={2}
                >
                  {order.delivery?.address}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        <Card className="mt-5 rounded-[24px] p-6">
          <Text className="text-[30px] font-extrabold text-slate-900">
            Thông tin khách hàng
          </Text>

          <View className="mt-4 flex-row items-center gap-3">
            {customerAvatar ? (
              <Image
                source={{ uri: customerAvatar }}
                className="h-14 w-14 rounded-full bg-slate-200"
                resizeMode="cover"
              />
            ) : (
              <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-500">
                <Text className="text-xl font-extrabold text-white">
                  {(customerName[0] || "K").toUpperCase()}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-[22px] font-bold text-slate-900">
                {customerName}
              </Text>
              <Text className="text-[18px] text-slate-500">
                {customerPhone || "Chưa có số điện thoại"}
              </Text>
            </View>
            <Pressable
              className={`h-11 w-11 items-center justify-center rounded-full ${customerPhone ? "bg-emerald-500" : "bg-slate-200"}`}
              onPress={handleContact}
              disabled={!customerPhone}
            >
              <Ionicons
                name="call"
                size={20}
                color={customerPhone ? "#ffffff" : "#64748b"}
              />
            </Pressable>
          </View>
        </Card>

        <Card className="mt-5 rounded-[24px] p-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-extrabold text-slate-900">
              Danh sách đồ đạc
            </Text>
            <View className="rounded-full bg-emerald-100 px-4 py-1">
              <Text className="text-base font-bold text-emerald-700">
                {items.length} món
              </Text>
            </View>
          </View>

          <View className="mt-4">
            {items.map((item, index) => (
              <View
                key={index}
                className={`flex-row items-start justify-between py-4 ${index !== items.length - 1 ? "border-b border-slate-100" : ""}`}
              >
                <View className="mr-3 flex-1">
                  <Text className="text-lg font-semibold text-slate-800">
                    {stripSecTag(item.name)}
                  </Text>
                  {item.notes ? (
                    <Text className="mt-1 text-base text-slate-500">
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-lg font-extrabold text-emerald-700">
                  {item.quantity}
                </Text>
              </View>
            ))}
          </View>

          <View className="mt-5 h-px bg-slate-100" />

          <View className="mt-5 gap-4">
            <Text className="text-xl font-extrabold text-slate-900">
              Bằng chứng hoàn thành
            </Text>

            <View>
              <Text className="mb-2 text-base font-bold text-slate-700">
                Trước khi vận chuyển:
              </Text>
              {renderEvidenceList(beforeImages)}
              <Text className="mt-2 text-sm text-slate-600">
                Ghi chú: {beforeNote || "Chưa có ghi chú"}
              </Text>
            </View>

            <View>
              <Text className="mb-2 text-base font-bold text-slate-700">
                Sau khi giao:
              </Text>
              {renderEvidenceList(afterImages)}
              <Text className="mt-2 text-sm text-slate-600">
                Ghi chú: {afterNote || "Chưa có ghi chú"}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 p-4">
        <Button
          title="Xem bản đồ và cập nhật"
          className="h-20"
          onPress={() =>
            navigation.navigate("OrderMap", {
              assignmentId: order.assignmentId,
              invoiceId: order.id,
            })
          }
        />
      </View>
    </View>
  );
};

export default OrderDetailsScreen;
