import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { apiRequest, endpoints } from "../api";

type OrderMapRouteProp = RouteProp<RootStackParamList, "OrderMap">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const OrderMapScreen: React.FC = () => {
  const route = useRoute<OrderMapRouteProp>();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const assignmentId = route.params.assignmentId;

  const fetchStatus = async () => {
     try {
        const result = await apiRequest(endpoints.staff.getOrderDetails(route.params.invoiceId));
        if (result.success) {
           setStatus(result.data.status);
        }
     } catch (error) {
        console.error("Fetch status failed:", error);
     } finally {
        setLoading(false);
     }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const updateStatus = async (newStatus: string) => {
    try {
      const result = await apiRequest(endpoints.staff.updateAssignmentStatus(assignmentId), {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (result.success) {
        setStatus(newStatus);
        Alert.alert("Success", `Status updated to ${newStatus}`);
        if (newStatus === "COMPLETED") {
          navigation.navigate("OrderList");
        }
      }
    } catch (error) {
       console.error("Update status failed:", error);
       Alert.alert("Error", "Failed to update status");
    }
  };

  const renderActionButton = () => {
    switch (status) {
      case "PENDING":
        return (
          <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus("IN_PROGRESS")}>
            <Text style={styles.actionBtnText}>ARRIVED AT PICKUP</Text>
          </TouchableOpacity>
        );
      case "IN_PROGRESS":
        return (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#22C55E" }]} onPress={() => updateStatus("COMPLETED")}>
            <Text style={styles.actionBtnText}>FINISH DELIVERY</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Real Map would go here. Using a placeholder for now */}
      <View style={styles.mapPlaceholder}>
         {/* Since I cannot embed the generated image directly into code yet, I'll use a stylized View */}
         <View style={styles.mapOverlay}>
            <Text style={styles.mapText}>Optimal Route Active 📍</Text>
            <View style={styles.pathGraphic}>
               <View style={styles.dotStart} />
               <View style={styles.pathLine} />
               <View style={styles.dotEnd} />
            </View>
         </View>
         <View style={styles.mockMapBackground} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
           <Text style={styles.headerTitle}>Delivery Route</Text>
           <Text style={styles.headerSubtitle}>Assign ID: {assignmentId.substring(0, 8)}...</Text>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        <View style={styles.infoRow}>
           <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>TIME</Text>
              <Text style={styles.infoValue}>25 min</Text>
           </View>
           <View style={styles.vDivider} />
           <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>DISTANCE</Text>
              <Text style={styles.infoValue}>5.2 km</Text>
           </View>
        </View>

        <View style={styles.addressSection}>
            <Text style={styles.addrHeading}>To: Cẩm Lệ, Đà Nẵng</Text>
            <Text style={styles.addrSub}>Expected arrival: 10:30 AM</Text>
        </View>

        {renderActionButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F0F0",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 15,
    borderRadius: radius.lg,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  headerInfo: {
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  mockMapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#D1D5DB",
    // In real app, this would be the MapView
  },
  mapOverlay: {
    zIndex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 20,
    borderRadius: radius.lg,
  },
  mapText: {
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 10,
  },
  pathGraphic: {
    flexDirection: "row",
    alignItems: "center",
    width: 150,
  },
  dotStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1D9BF0",
  },
  pathLine: {
    flex: 1,
    height: 3,
    backgroundColor: "#1D9BF0",
    borderStyle: "dashed",
    borderRadius: 1,
  },
  dotEnd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  bottomSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: spacing.xl,
    paddingTop: 12,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 25,
  },
  infoBlock: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  vDivider: {
    width: 1,
    height: "100%",
    backgroundColor: colors.border,
  },
  addressSection: {
    marginBottom: 30,
  },
  addrHeading: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
  },
  addrSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    borderRadius: radius.lg,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  actionBtnText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

export default OrderMapScreen;
