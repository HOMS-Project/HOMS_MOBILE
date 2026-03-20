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
  customer: {
    name: string;
    phone: string;
    email: string;
  };
};

const OrderDetailsScreen: React.FC = () => {
  const route = useRoute<OrderDetailsRouteProp>();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const fetchOrderDetails = async () => {
    try {
      const result = await apiRequest(endpoints.staff.getOrderDetails(route.params.invoiceId));
      if (result.success) {
        setOrder(result.data);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={styles.orderCode}>{order.orderCode}</Text>
          <Text style={styles.orderTime}>
            Scheduled: {new Date(order.scheduledTime).toLocaleString()}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          <View style={styles.locationCard}>
             <View style={styles.locRow}>
                <View style={[styles.dot, { backgroundColor: "#1D9BF0" }]} />
                <View>
                   <Text style={styles.locLabel}>Pickup</Text>
                   <Text style={styles.locValue}>{order.pickup.address}</Text>
                </View>
             </View>
             <View style={styles.connector} />
             <View style={styles.locRow}>
                <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
                <View>
                   <Text style={styles.locLabel}>Drop-off</Text>
                   <Text style={styles.locValue}>{order.delivery.address}</Text>
                </View>
             </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.customerHeader}>
               <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{order.customer.name[0]}</Text>
               </View>
               <View>
                  <Text style={styles.customerName}>{order.customer.name}</Text>
                  <Text style={styles.customerPhone}>{order.customer.phone}</Text>
               </View>
            </View>
            <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
              <Text style={styles.contactBtnText}>Contact Customer 📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items List ({order.items.length})</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
              </View>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.mapBtn} 
          onPress={() => navigation.navigate("OrderMap", { 
            assignmentId: order.assignmentId, 
            invoiceId: order.id 
          })}
        >
          <Text style={styles.mapBtnText}>Go to Map & Update Status</Text>
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
    gap: 4,
  },
  orderCode: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
  },
  orderTime: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: "600",
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
  contactBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  contactBtnText: {
    color: colors.buttonText,
    fontWeight: "800",
    fontSize: 16,
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
