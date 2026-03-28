import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";

import { apiRequest, endpoints } from "../api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const fallbackAvatar =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80";

const StaffHomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const fetchData = async () => {
    try {
      // Gọi song song nhưng xử lý độc lập để lỗi 1 cái không làm trắng màn hình
      const ordersPromise = apiRequest(endpoints.staff.getOrders)
        .then((res) => {
          if (res.success) setOrders(res.data);
        })
        .catch((err) => console.error("Orders fetch failed:", err));

      const profilePromise = apiRequest(endpoints.user.getProfile)
        .then((res) => {
          if (res.success) setUser(res.data);
        })
        .catch((err) => console.error("Profile fetch failed:", err));

      await Promise.all([ordersPromise, profilePromise]);
    } catch (error) {
      console.error("Fetch data general error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentOrder =
    orders.find((o) => o.status === "IN_PROGRESS") || orders[0];
  const recentOrders = orders
    .filter((o) => o.status === "COMPLETED")
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBanner}>
          <View style={styles.topRow}>
            <View style={styles.avatarCircle}>
              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Image
                  source={{ uri: user?.avatar || fallbackAvatar }}
                  style={styles.avatar}
                />
              )}
            </View>
            <View style={styles.nameBlock}>
              <Text style={styles.name}>
                {user?.fullName || user?.username || "Staff"}
              </Text>
              <Text style={styles.role}>{user?.role || "Team Member"}</Text>
            </View>
            <View style={styles.spacer} />
            <TouchableOpacity style={styles.notifyBtn}>
              <Text style={styles.notifyIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("MySchedule")}
            >
              <Text style={styles.quickLabel}>My Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("OrderList")}
            >
              <Text style={styles.quickLabel}>Order List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() =>
                navigation.navigate("OrderMap", {
                  assignmentId: currentOrder?.assignmentId || "placeholder",
                  invoiceId: currentOrder?.invoiceId || "placeholder",
                })
              }
            >
              <Text style={styles.quickLabel}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Order</Text>
          <TouchableOpacity onPress={() => navigation.navigate("OrderList")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : currentOrder ? (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() =>
              navigation.navigate("OrderDetails", {
                invoiceId: currentOrder.invoiceId,
              })
            }
          >
            <View style={styles.orderTopRow}>
              <Text style={styles.orderIcon}>📦</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderCode}>{currentOrder.orderCode}</Text>
                <Text style={styles.orderMeta}>
                  {new Date(currentOrder.scheduledTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {currentOrder.status}
                </Text>
              </View>
              <Text style={styles.chevron}>{">"}</Text>
            </View>

            <View style={styles.progress}>
              <View style={styles.progressLine} />
              <View style={styles.progressDotLeft}>
                <Text style={styles.progressCheck}>✓</Text>
              </View>
              <View style={styles.progressDotRight} />
            </View>

            <View style={styles.addrRow}>
              <View style={styles.addrBlock}>
                <Text style={styles.addrLabel}>From</Text>
                <Text style={styles.addrValue}>
                  {currentOrder.pickup.address}
                </Text>
              </View>
              <View style={styles.addrBlockRight}>
                <Text style={styles.addrLabel}>To</Text>
                <Text style={styles.addrValue}>
                  {currentOrder.delivery.address}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.emptyText}>No orders assigned</Text>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Order</Text>
          <TouchableOpacity>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.map((item) => (
          <View key={item.invoiceId || item.id} style={styles.orderCard}>
            <View style={styles.orderTopRow}>
              <Text style={styles.orderIcon}>📦</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderCode}>{item.code}</Text>
                <Text style={styles.orderMeta}>
                  {item.time} · {item.status} · {item.date}
                </Text>
              </View>
              <Text style={styles.chevron}>{">"}</Text>
            </View>
            <View style={styles.addrRow}>
              <View style={styles.addrBlock}>
                <Text style={styles.addrLabel}>From</Text>
                <Text style={styles.addrValue}>{item.from}</Text>
              </View>
              <View style={styles.addrBlockRight}>
                <Text style={styles.addrLabel}>To</Text>
                <Text style={styles.addrValue}>{item.to}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl + 10,
    paddingTop: spacing.xl + 12,
    paddingBottom: spacing.xl + 10,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    gap: spacing.xl + 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#E6F4EA",
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  nameBlock: {
    marginLeft: spacing.md,
  },
  name: {
    color: colors.buttonText,
    fontWeight: "800",
    fontSize: 24,
  },
  role: {
    color: "#DCE7DC",
    fontSize: 17,
  },
  spacer: {
    flex: 1,
  },
  notifyBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifyIcon: {
    color: colors.buttonText,
    fontSize: 20,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickCard: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: "center",
  },
  quickLabel: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 17,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  link: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 17,
  },
  orderCard: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: spacing.sm,
  },
  orderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  orderIcon: {
    fontSize: 32,
  },
  orderCode: {
    fontWeight: "800",
    color: colors.text,
    fontSize: 21,
  },
  orderMeta: {
    color: colors.muted,
    marginTop: 2,
    fontSize: 17,
  },
  chevron: {
    color: colors.muted,
    fontSize: 22,
  },
  progress: {
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  progressLine: {
    height: 3,
    backgroundColor: "#1D9BF0",
    borderRadius: 3,
    width: "100%",
  },
  progressDotLeft: {
    position: "absolute",
    left: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1D9BF0",
    alignItems: "center",
    justifyContent: "center",
  },
  progressCheck: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 12,
  },
  progressDotRight: {
    position: "absolute",
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: "#1D9BF0",
  },
  addrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  addrBlock: {
    flex: 1,
    alignItems: "flex-start",
  },
  addrBlockRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  addrLabel: {
    color: colors.muted,
    fontWeight: "700",
    marginBottom: 4,
    fontSize: 17,
  },
  addrValue: {
    color: colors.text,
    fontWeight: "700",
    textAlign: "right",
    fontSize: 19,
  },
  emptyText: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 20,
    fontSize: 17,
  },
});

export default StaffHomeScreen;
