import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { apiRequest, endpoints } from "../api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Order = {
  dispatchAssignmentId: string;
  assignmentId: string;
  invoiceId: string;
  orderCode: string;
  status: string;
  pickup: { address: string; district: string };
  delivery: { address: string; district: string };
  scheduledTime: string;
  items: { name: string; quantity: number }[];
};

const OrderListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const result = await apiRequest(endpoints.staff.getOrders);
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error("Fetch orders failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "#22C55E";
      case "IN_PROGRESS": return "#1D9BF0";
      case "PENDING": return "#F59E0B";
      default: return colors.muted;
    }
  };

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order.invoiceId}
      style={styles.card}
      onPress={() => navigation.navigate("OrderDetails", { invoiceId: order.invoiceId })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.codeRow}>
          <Text style={styles.boxIcon}>📦</Text>
          <Text style={styles.orderCode}>{order.orderCode}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeDecor}>
          <View style={styles.dotBlue} />
          <View style={styles.line} />
          <View style={styles.dotRed} />
        </View>
        <View style={styles.addressContainer}>
          <Text style={styles.addressText} numberOfLines={1}>{order.pickup.address}</Text>
          <Text style={styles.addressText} numberOfLines={1}>{order.delivery.address}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.itemCount}>{order.items.length} items</Text>
        <Text style={styles.timeText}>
          {new Date(order.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const inProgress = orders.filter(o => o.status === "IN_PROGRESS");
  const upcoming = orders.filter(o => o.status !== "IN_PROGRESS" && o.status !== "COMPLETED");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assigned Orders</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {inProgress.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>In Progress</Text>
            {inProgress.map(renderOrderCard)}
          </>
        )}

        <Text style={styles.sectionTitle}>Upcoming</Text>
        {upcoming.length > 0 ? (
          upcoming.map(renderOrderCard)
        ) : (
          <Text style={styles.emptyText}>No upcoming orders</Text>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  boxIcon: {
    fontSize: 20,
  },
  orderCode: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.buttonText,
    fontSize: 12,
    fontWeight: "800",
  },
  routeContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  routeDecor: {
    alignItems: "center",
    paddingVertical: 4,
  },
  dotBlue: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1D9BF0",
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  addressContainer: {
    flex: 1,
    justifyContent: "space-between",
    gap: 8,
  },
  addressText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  timeText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 16,
    marginTop: 20,
  },
});

export default OrderListScreen;
