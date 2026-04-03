import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
    email?: string;
  };
};

const stripSecTag = (name?: string) => {
  if (!name) return "";
  return name.replace(/^\s*\[SEC:[^\]]+\]\s*/i, "").trim();
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Chua xac dinh";
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()} ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const statusLabel = (status: string) => {
  if (status === "IN_PROGRESS") return "Dang thuc hien";
  if (status === "ACCEPTED") return "Da nhan don";
  if (status === "COMPLETED") return "Da hoan tat";
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
          Khong the tai thong tin don hang
        </Text>
      </View>
    );
  }

  const customerName = order.customer?.name || "Khach hang";
  const customerPhone = order.customer?.phone || "";

  const handleContact = () => {
    if (customerPhone) {
      Linking.openURL(`tel:${customerPhone}`);
    }
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
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#0f172a" />
          </Pressable>
          <Text className="ml-3 text-xl font-extrabold text-slate-900">
            Chi tiet don hang
          </Text>
        </View>

        <Card className="mt-6 items-center rounded-[28px] border-emerald-100 bg-emerald-50/80 p-6">
          <View
            className={`rounded-full px-3 py-1 ${statusClass(order.status)}`}
          >
            <Text className="text-xs font-bold">
              {statusLabel(order.status)}
            </Text>
          </View>
          <Text className="mt-3 text-3xl font-extrabold tracking-wide text-slate-900">
            {order.orderCode}
          </Text>
        </Card>

        <Card className="mt-5 gap-4 rounded-[24px] p-5">
          <View className="flex-row items-start gap-3">
            <Ionicons name="calendar-outline" size={20} color="#0f766e" />
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Lich hen khach hang
              </Text>
              <Text className="mt-1 text-sm font-semibold text-slate-800">
                {formatDate(order.scheduledTime)}
              </Text>
            </View>
          </View>

          <View className="h-px bg-slate-100" />

          <View className="flex-row items-start gap-3">
            <Ionicons name="time-outline" size={20} color="#d97706" />
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Thoi gian dieu phoi du kien
              </Text>
              <Text className="mt-1 text-sm font-semibold text-slate-800">
                {formatDate(order.dispatchTime || order.scheduledTime)}
              </Text>
            </View>
          </View>
        </Card>

        <Card className="mt-5 gap-4 rounded-[24px] p-5">
          <Text className="text-lg font-extrabold text-slate-900">
            Lo trinh di chuyen
          </Text>

          <View className="gap-3 rounded-2xl bg-slate-50 p-3">
            <View className="flex-row items-start gap-2">
              <Ionicons name="ellipse" size={10} color="#2563eb" />
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Pickup
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
              <Ionicons name="ellipse" size={10} color="#ef4444" />
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Drop-off
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

        <Card className="mt-5 rounded-[24px] p-5">
          <Text className="text-lg font-extrabold text-slate-900">
            Thong tin khach hang
          </Text>

          <View className="mt-4 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
              <Text className="text-lg font-extrabold text-white">
                {(customerName[0] || "K").toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900">
                {customerName}
              </Text>
              <Text className="text-sm text-slate-500">
                {customerPhone || "Chua co so dien thoai"}
              </Text>
            </View>
            <Pressable
              className={`h-10 w-10 items-center justify-center rounded-full ${customerPhone ? "bg-emerald-500" : "bg-slate-200"}`}
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

        <Card className="mt-5 rounded-[24px] p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-extrabold text-slate-900">
              Danh sach do dac
            </Text>
            <View className="rounded-full bg-emerald-100 px-3 py-1">
              <Text className="text-xs font-bold text-emerald-700">
                {order.items.length} mon
              </Text>
            </View>
          </View>

          <View className="mt-4">
            {order.items.map((item, index) => (
              <View
                key={index}
                className={`flex-row items-start justify-between py-3 ${index !== order.items.length - 1 ? "border-b border-slate-100" : ""}`}
              >
                <View className="mr-3 flex-1">
                  <Text className="text-sm font-semibold text-slate-800">
                    {stripSecTag(item.name)}
                  </Text>
                  {item.notes ? (
                    <Text className="mt-1 text-xs text-slate-500">
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-sm font-extrabold text-emerald-700">
                  {item.quantity}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 p-4">
        <Button
          title="Xem ban do va cap nhat"
          className="h-14"
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
