import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { staffApi } from "../api";
import { showToast } from "../utils/toast";

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
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "IN_PROGRESS" | "ACCEPTED" | "COMPLETED" | "OTHER"
  >("ALL");
  const [timeFilter, setTimeFilter] = useState<
    "ALL" | "TODAY" | "WEEK" | "MONTH"
  >("ALL");

  const fetchOrders = useCallback(async () => {
    try {
      const result = await staffApi.getOrders();
      const payload = (result as any)?.data ?? result;
      setOrders(payload || []);
    } catch (error: any) {
      console.error("Fetch orders failed:", error);
      showToast(error?.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "#22C55E";
      case "IN_PROGRESS":
        return "#1D9BF0";
      case "ACCEPTED":
        return "#F59E0B";
      default:
        return colors.muted;
    }
  };

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order.invoiceId}
      style={styles.card}
      onPress={() =>
        navigation.navigate("OrderDetails", { invoiceId: order.invoiceId })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.codeRow}>
          <Text style={styles.boxIcon}>📦</Text>
          <Text style={styles.orderCode}>{order.orderCode}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) },
          ]}
        >
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
          <Text style={styles.addressText} numberOfLines={1}>
            {order.pickup.address}
          </Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {order.delivery.address}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.itemCount}>{order.items.length} items</Text>
        <Text style={styles.timeText}>
          {new Date(order.scheduledTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
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

  const normalized = orders.map((o) => ({
    ...o,
    status: (o.status || "").toUpperCase(),
  }));

  const applyTimeFilter = (o: Order) => {
    if (timeFilter === "ALL") return true;
    const ts = new Date(o.scheduledTime).getTime();
    if (Number.isNaN(ts)) return false;
    const now = Date.now();
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    if (timeFilter === "TODAY") return ts >= startToday.getTime();
    if (timeFilter === "WEEK") return ts >= now - 7 * 24 * 60 * 60 * 1000;
    if (timeFilter === "MONTH") return ts >= now - 30 * 24 * 60 * 60 * 1000;
    return true;
  };

  const filtered = normalized.filter((o) => {
    const statusOk =
      statusFilter === "ALL"
        ? true
        : statusFilter === "OTHER"
          ? !["IN_PROGRESS", "ACCEPTED", "COMPLETED"].includes(o.status)
          : o.status === statusFilter;
    const timeOk = applyTimeFilter(o);
    return statusOk && timeOk;
  });

  // Show all orders assigned to this staff; keep simple grouping for readability
  const inProgress = filtered.filter((o) => o.status === "IN_PROGRESS");
  const accepted = filtered.filter((o) => o.status === "ACCEPTED");
  const others = filtered.filter(
    (o) => !["IN_PROGRESS", "ACCEPTED"].includes(o.status),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assigned Orders</Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters((prev) => !prev)}
        >
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterBar}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.chipRow}>
              {(
                [
                  "ALL",
                  "IN_PROGRESS",
                  "ACCEPTED",
                  "COMPLETED",
                  "OTHER",
                ] as const
              ).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, statusFilter === s && styles.chipActive]}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      statusFilter === s && styles.chipTextActive,
                    ]}
                  >
                    {s === "IN_PROGRESS"
                      ? "In Progress"
                      : s === "ACCEPTED"
                        ? "Accepted"
                        : s === "COMPLETED"
                          ? "Completed"
                          : s === "OTHER"
                            ? "Other"
                            : "All"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Time</Text>
            <View style={styles.chipRow}>
              {(["ALL", "TODAY", "WEEK", "MONTH"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, timeFilter === t && styles.chipActive]}
                  onPress={() => setTimeFilter(t)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      timeFilter === t && styles.chipTextActive,
                    ]}
                  >
                    {t === "TODAY"
                      ? "Today"
                      : t === "WEEK"
                        ? "This Week"
                        : t === "MONTH"
                          ? "This Month"
                          : "All"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {inProgress.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>In Progress</Text>
            {inProgress.map(renderOrderCard)}
          </>
        )}

        {accepted.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Accepted</Text>
            {accepted.map(renderOrderCard)}
          </>
        )}

        {others.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Other</Text>
            {others.map(renderOrderCard)}
          </>
        )}

        {normalized.length === 0 && (
          <Text style={styles.emptyText}>No orders</Text>
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
  filterBtn: {
    marginLeft: "auto",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  filterBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterGroup: {
    gap: spacing.xs,
  },
  filterLabel: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 13,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(20,139,165,0.08)",
  },
  chipText: {
    color: colors.text,
    fontWeight: "700",
  },
  chipTextActive: {
    color: colors.primary,
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
