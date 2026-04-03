import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { apiRequest, endpoints } from "../api";

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
  customer: {
    name: string;
    phone: string;
    email: string;
  };
};

const stripSecTag = (name?: string) => {
  if (!name) return "";
  return name.replace(/^\s*\[SEC:[^\]]+\]\s*/i, "").trim();
};

const Tag: React.FC<{
  children: React.ReactNode;
  color: string;
  style?: any;
}> = ({ children, color, style }) => (
  <View
    style={[
      {
        backgroundColor: color + "20",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
      },
      style,
    ]}
  >
    <Text
      style={{
        color: color,
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  </View>
);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa xác định";
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const handleContact = () => {
    if (order?.customer.phone) {
      Linking.openURL(`tel:${order.customer.phone}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) return null;

  const customerName = order.customer?.name || "Khach hang";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainInfo}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {order.status === "IN_PROGRESS"
                ? "Đang thực hiện"
                : order.status === "ACCEPTED"
                  ? "Đã nhận đơn"
                  : order.status === "COMPLETED"
                    ? "Đã hoàn tất"
                    : order.status}
            </Text>
          </View>
          <Text style={styles.orderCode}>{order.orderCode}</Text>
        </View>

        <View style={styles.timeCard}>
          <View style={styles.timeRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primary}
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.timeLabel}>Lịch hẹn khách hàng</Text>
              <Text style={styles.timeValue}>
                {formatDate(order.scheduledTime)}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.timeRow,
              {
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: "#f0f0f0",
              },
            ]}
          >
            <Ionicons name="time-outline" size={20} color="#EAB308" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.timeLabel}>Thời gian điều phối dự kiến</Text>
              <Text style={styles.timeValue}>
                {formatDate(order.dispatchTime || order.scheduledTime)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lộ trình di chuyển</Text>
          <View style={styles.locationCard}>
            <View style={styles.locRow}>
              <View style={[styles.dot, { backgroundColor: "#1D9BF0" }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locLabel}>Điểm lấy hàng (Pickup)</Text>
                <Text style={styles.locValue} numberOfLines={2}>
                  {order.pickup.address}
                </Text>
              </View>
            </View>
            <View style={styles.connector} />
            <View style={styles.locRow}>
              <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locLabel}>Điểm giao hàng (Drop-off)</Text>
                <Text style={styles.locValue} numberOfLines={2}>
                  {order.delivery.address}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.infoCard}>
            <View style={styles.customerHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{customerName[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{order.customer.name}</Text>
                <Text style={styles.customerPhone}>{order.customer.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callIconBtn}
                onPress={handleContact}
              >
                <Ionicons name="call" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.sectionTitle}>Danh sách đồ đạc</Text>
            <Tag color={colors.primary} style={{ borderRadius: 12 }}>
              {order.items.length} món
            </Tag>
          </View>
          <View style={styles.itemsCard}>
            {order.items.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.itemRow,
                  index === order.items.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.itemMain}>
                  <Text style={styles.itemName}>{stripSecTag(item.name)}</Text>
                  {item.notes && (
                    <Text style={styles.itemNotes}>{item.notes}</Text>
                  )}
                </View>
                <Text style={styles.itemQty}>{item.quantity}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() =>
            navigation.navigate("OrderMap", {
              assignmentId: order.assignmentId,
              invoiceId: order.id,
            })
          }
        >
          <Text style={styles.mapBtnText}>Xem bản đồ & Cập nhật</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginLeft: spacing.lg,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  mainInfo: {
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  statusBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  orderCode: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
  timeCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  timeValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  locationCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  locRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "700",
  },
  locValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  connector: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 5,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.lg,
  },
  customerHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: colors.buttonText,
    fontSize: 24,
    fontWeight: "800",
  },
  customerName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  customerPhone: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: "600",
  },
  callIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  itemsSection: {
    gap: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  itemNotes: {
    fontSize: 14,
    color: colors.muted,
    fontStyle: "italic",
  },
  itemQty: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mapBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mapBtnText: {
    color: colors.buttonText,
    fontWeight: "800",
    fontSize: 18,
  },
});

export default OrderDetailsScreen;
