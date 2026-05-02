import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  RefreshControl,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
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
  moveType?: string;
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
  rentalDetails?: {
    rentalDurationHours?: number;
    truckType?: string;
  };
  completionEvidence?: {
    beforeImages?: string[];
    afterImages?: string[];
    beforeNote?: string;
    afterNote?: string;
  };
  survey?: {
    distanceKm?: number;
    floors?: number;
    hasElevator?: boolean;
    carryMeter?: number;
    needsPacking?: boolean;
    needsAssembling?: boolean;
    insuranceRequired?: boolean;
    estimatedHours?: number;
    suggestedVehicle?: string;
    suggestedStaffCount?: number;
  };
};

const stripSecTag = (name?: string) => {
  if (!name) return "";
  return name.replace(/^\s*\[SEC:[^\]]+\]\s*/i, "").trim();
};

const moveTypeLabel = (type?: string) => {
  if (type === "FULL_HOUSE") return "Chuyển nhà trọn gói";
  if (type === "SPECIFIC_ITEMS") return "Chuyển đồ đạc";
  if (type === "TRUCK_RENTAL") return "Thuê xe tải";
  return "Dịch vụ vận chuyển";
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

const normalizeStatus = (status?: string) => (status || "").toUpperCase();

const statusLabel = (status: string) => {
  const s = normalizeStatus(status);
  if (s === "IN_PROGRESS") return "Đang thực hiện";
  if (s === "ACCEPTED") return "Đã nhận đơn";
  if (s === "COMPLETED") return "Đã hoàn tất";
  if (s === "ASSIGNED") return "Đã phân công";
  if (s === "CONFIRMED") return "Đã xác nhận";
  if (s === "PENDING") return "Chờ xử lý";
  if (s === "CANCELLED") return "Đã hủy";
  return "Khác";
};

const statusClass = (status: string) => {
  const s = normalizeStatus(status);
  if (s === "IN_PROGRESS") return "bg-sky-100 text-sky-700";
  if (s === "ACCEPTED") return "bg-amber-100 text-amber-700";
  if (s === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (s === "ASSIGNED") return "bg-violet-100 text-violet-700";
  if (s === "CONFIRMED") return "bg-cyan-100 text-cyan-700";
  if (s === "PENDING") return "bg-orange-100 text-orange-700";
  if (s === "CANCELLED") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
};

const OrderDetailsScreen: React.FC = () => {
  const route = useRoute<OrderDetailsRouteProp>();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
          survey: payload.survey || null,
          rentalDetails: payload.rentalDetails || null,
        });
      }
    } catch (error) {
      console.error("Fetch order details failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetails();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#edf4ef]">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-100/70 px-6">
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
  const closePreview = () => setPreviewImage(null);

  const renderEvidenceList = (images: string[]) => {
    if (!images.length) {
      return (
        <View className="rounded-2xl bg-emerald-50/50 px-4 py-3">
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
          <Pressable
            key={`${uri}-${index}`}
            className="mr-3 h-28 w-28 overflow-hidden rounded-2xl bg-slate-200"
            onPress={() => setPreviewImage(uri)}
          >
            <Image
              source={{ uri }}
              className="h-full w-full"
              resizeMode="cover"
            />
          </Pressable>
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
    <View className="flex-1 bg-[#edf4ef]">
      <View className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/35" />
      <View className="absolute -left-16 bottom-14 h-56 w-56 rounded-full bg-sky-200/40" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingTop: 32,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#10b981"]}
            tintColor="#10b981"
          />
        }
      >
        <View className="flex-row items-center">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </Pressable>
          <Text className="ml-3 text-2xl font-extrabold text-slate-900">
            Chi tiết đơn hàng
          </Text>
        </View>

        <Card className="mt-5 items-center rounded-[18px] border-emerald-100 bg-emerald-50/80 p-5">
          <View
            className={`rounded-full px-3 py-1 ${statusClass(order.status)}`}
          >
            <Text className="text-[11px] font-bold">
              {statusLabel(order.status)}
            </Text>
          </View>
          <Text className="mt-2 text-xl font-extrabold tracking-wide text-slate-900">
            {order.orderCode}
          </Text>
        </Card>

        <Card className="mt-4 flex-row items-center rounded-[20px] p-4">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <Ionicons name="cube-outline" size={20} color="#047857" />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Loại dịch vụ
            </Text>
            <Text className="mt-0.5 text-base font-extrabold text-slate-900">
              {moveTypeLabel(order.moveType)}
            </Text>
          </View>
        </Card>

        <Card className="mt-4 gap-3.5 rounded-[20px] p-4">
          <View className="flex-row items-start gap-3">
            <Ionicons name="calendar-outline" size={18} color="#0f766e" />
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Lịch hẹn khách hàng
              </Text>
              <Text className="mt-0.5 text-sm font-semibold text-slate-800">
                {formatDate(order.scheduledTime)}
              </Text>
            </View>
          </View>

          <View className="h-px bg-emerald-100/70" />

          <View className="flex-row items-start gap-3">
            <Ionicons name="time-outline" size={18} color="#d97706" />
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {order.moveType === "TRUCK_RENTAL" ? "Thời gian thuê xe" : "Thời gian vận chuyển ước tính"}
              </Text>
              <Text className="mt-0.5 text-sm font-semibold text-slate-800">
                {order.moveType === "TRUCK_RENTAL" 
                  ? (order.rentalDetails?.rentalDurationHours ? `${order.rentalDetails.rentalDurationHours} giờ` : "Chưa có thông tin")
                  : (order.survey?.estimatedHours ? `${order.survey.estimatedHours} giờ` : "Chưa có ước tính")}
              </Text>
            </View>
          </View>
        </Card>

        <Card className="mt-4 gap-3 rounded-[20px] p-4">
          <Text className="text-lg font-extrabold text-slate-900">
            Lộ trình di chuyển
          </Text>

          <View className="gap-2.5 p-1">
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={9} color="#2563eb" />
              <View className="flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Điểm lấy
                </Text>
                <Text
                  className="text-sm font-medium text-slate-700"
                  numberOfLines={2}
                >
                  {order.pickup?.address}
                </Text>
              </View>
            </View>

            <View className="ml-1 h-4 w-px bg-slate-300" />

            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={9} color="#ef4444" />
              <View className="flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Điểm giao
                </Text>
                <Text
                  className="text-sm font-medium text-slate-700"
                  numberOfLines={2}
                >
                  {order.delivery?.address}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        <Card className="mt-4 rounded-[20px] p-4">
          <Text className="text-lg font-extrabold text-slate-900">
            Thông tin khách hàng
          </Text>

          <View className="mt-3.5 flex-row items-center gap-3">
            {customerAvatar ? (
              <Image
                source={{ uri: customerAvatar }}
                className="h-10 w-10 rounded-full bg-slate-200"
                resizeMode="cover"
              />
            ) : (
              <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
                <Text className="text-base font-extrabold text-white">
                  {(customerName[0] || "K").toUpperCase()}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900">
                {customerName}
              </Text>
              <Text className="text-sm text-slate-500">
                {customerPhone || "Chưa có số điện thoại"}
              </Text>
            </View>
            <Pressable
              className={`h-9 w-9 items-center justify-center rounded-full ${customerPhone ? "bg-emerald-500" : "bg-slate-200"}`}
              onPress={handleContact}
              disabled={!customerPhone}
            >
              <Ionicons
                name="call"
                size={18}
                color={customerPhone ? "#ffffff" : "#64748b"}
              />
            </Pressable>
          </View>
        </Card>

        {order.survey && (
          <>
            {order.moveType !== "TRUCK_RENTAL" && (
              <Card className="mt-4 rounded-[20px] p-4">
                <Text className="text-lg font-extrabold text-slate-900">
                  1. Địa hình & Vận chuyển
                </Text>
              
              {(order.survey.floors || 0) > 1 && !order.survey.hasElevator && (
                <View className="mt-3 flex-row items-center rounded-xl bg-amber-50 p-3 border border-amber-100">
                  <Ionicons name="warning" size={18} color="#D97706" />
                  <Text className="ml-2 flex-1 text-xs font-bold text-amber-800">
                    Lưu ý: Đơn hàng ở tầng cao ({order.survey.floors}) và KHÔNG có thang máy.
                  </Text>
                </View>
              )}

              <View className="mt-4 flex-row flex-wrap gap-y-4">
                <View className="w-1/2 pr-2">
                  <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Số tầng lầu</Text>
                  <Text className="mt-1 text-base font-extrabold text-slate-900">{order.survey.floors ?? "--"}</Text>
                </View>
                <View className="w-1/2 pl-2">
                  <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Thang máy</Text>
                  <View className="mt-1 flex-row items-center">
                    <Ionicons 
                      name={order.survey.hasElevator ? "checkmark-circle" : "close-circle"} 
                      size={18} 
                      color={order.survey.hasElevator ? "#10b981" : "#ef4444"} 
                    />
                    <Text className={`ml-1.5 text-base font-extrabold ${order.survey.hasElevator ? "text-emerald-700" : "text-rose-700"}`}>
                      {order.survey.hasElevator ? "Có" : "Không"}
                    </Text>
                  </View>
                </View>
                <View className="w-1/2 pr-2">
                  <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Bề bộ (m)</Text>
                  <Text className="mt-1 text-base font-extrabold text-slate-900">{order.survey.carryMeter ?? "--"} m</Text>
                </View>
                <View className="w-1/2 pl-2">
                  <Text className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Quãng đường</Text>
                  <Text className={`mt-1 text-base font-extrabold ${(order.survey.distanceKm || 0) > 15 ? "text-amber-600" : "text-slate-900"}`}>
                    {order.survey.distanceKm ?? "--"} km
                  </Text>
                </View>
                </View>
              </Card>
            )}

            <Card className="mt-4 rounded-[20px] p-4">
              <Text className="text-lg font-extrabold text-slate-900">
                2. Dịch vụ & Bảo hiểm
              </Text>
              
              <View className="mt-4 flex-row flex-wrap gap-2">
                <View className={`flex-row items-center px-3 py-2 rounded-xl border ${order.survey.needsAssembling ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100 opacity-60"}`}>
                  <Ionicons 
                    name={order.survey.needsAssembling ? "construct" : "remove-circle-outline"} 
                    size={16} 
                    color={order.survey.needsAssembling ? "#059669" : "#94a3b8"} 
                  />
                  <Text className={`ml-2 text-sm font-bold ${order.survey.needsAssembling ? "text-emerald-800" : "text-slate-500"}`}>
                    {order.survey.needsAssembling ? "Cần tháo/lắp" : "Không tháo/lắp"}
                  </Text>
                </View>

                <View className={`flex-row items-center px-3 py-2 rounded-xl border ${order.survey.needsPacking ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100 opacity-60"}`}>
                  <Ionicons 
                    name={order.survey.needsPacking ? "archive" : "remove-circle-outline"} 
                    size={16} 
                    color={order.survey.needsPacking ? "#059669" : "#94a3b8"} 
                  />
                  <Text className={`ml-2 text-sm font-bold ${order.survey.needsPacking ? "text-emerald-800" : "text-slate-500"}`}>
                    {order.survey.needsPacking ? "Cần đóng gói" : "Không đóng gói"}
                  </Text>
                </View>

                <View className={`flex-row items-center px-3 py-2 rounded-xl border ${order.survey.insuranceRequired ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100 opacity-60"}`}>
                  <Ionicons 
                    name={order.survey.insuranceRequired ? "shield-checkmark" : "shield-outline"} 
                    size={16} 
                    color={order.survey.insuranceRequired ? "#2563eb" : "#94a3b8"} 
                  />
                  <Text className={`ml-2 text-sm font-bold ${order.survey.insuranceRequired ? "text-blue-800" : "text-slate-500"}`}>
                    {order.survey.insuranceRequired ? "Có bảo hiểm" : "Không bảo hiểm"}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}

        <Card className="mt-4 rounded-[20px] p-4">

          {order.moveType !== "TRUCK_RENTAL" && (
            <>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-extrabold text-slate-900">
                  Danh sách đồ đạc
                </Text>
                <View className="rounded-full bg-emerald-100 px-3 py-0.5">
                  <Text className="text-xs font-bold text-emerald-700">
                    {items.length} món
                  </Text>
                </View>
              </View>

              <View className="mt-3">
                {items.map((item, index) => (
                  <View
                    key={index}
                    className={`flex-row items-start justify-between py-3 ${index !== items.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <View className="mr-3 flex-1">
                      <Text className="text-sm font-semibold text-slate-800">
                        {stripSecTag(item.name)}
                      </Text>
                      {item.notes ? (
                        <Text className="mt-0.5 text-xs text-slate-500">
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

              <View className="mt-5 h-px bg-emerald-100/70" />
            </>
          )}

          <View className={order.moveType !== "TRUCK_RENTAL" ? "mt-5 gap-4" : "gap-4"}>
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

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white/95 px-5 pb-8 pt-3">
        <Pressable
          className="h-[52px] w-full flex-row items-center justify-center rounded-full bg-[#16A34A] active:opacity-85"
          style={{
            shadowColor: "#16A34A",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
          onPress={() =>
            navigation.navigate("OrderMap", {
              assignmentId: order.assignmentId,
              invoiceId: order.id,
            })
          }
        >
          <Text className="text-base font-bold tracking-wide text-white">
            Xem bản đồ và cập nhật
          </Text>
        </Pressable>
      </View>

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

export default OrderDetailsScreen;
