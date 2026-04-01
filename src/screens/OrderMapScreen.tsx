import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import Constants from 'expo-constants';
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import axios from "axios";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { staffApi, endpoints, apiRequest } from "../api";

type OrderMapRouteProp = RouteProp<RootStackParamList, "OrderMap">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

// Hàm giải mã polyline từ Goong/Google
const decodePolyline = (encoded: string) => {
  if (!encoded) return [];
  const poly = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return poly;
};

// Helper to normalize coordinates (assuming Longitude > 100 for Vietnam)
const normalizeLatLng = (coord: any) => {
  if (!coord) return null;
  let lat = coord.lat ?? coord.latitude ?? coord[1] ?? 0;
  let lng = coord.lng ?? coord.longitude ?? coord[0] ?? 0;
  // If lat/lng are swapped (Vietnam: Lng > 100, Lat < 30)
  if (lat > lng) {
    [lat, lng] = [lng, lat];
  }
  return { latitude: lat, longitude: lng };
};

const OrderMapScreen: React.FC = () => {
  const route = useRoute<OrderMapRouteProp>();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [orderData, setOrderData] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deviationReason, setDeviationReason] = useState("");
  const [mapCoords, setMapCoords] = useState<{ pickup: any; delivery: any } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const assignmentId = route.params.assignmentId;
  const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY || "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjM3NzkzMTk1YTc5NzQ5MzY4ZDU1MWRmYjI3Y2ZiMzZiIiwiaCI6Im11cm11cjY0In0=";

  const fetchRoutes = async (p: any, d: any) => {
    try {
      const pLng = Number(p.longitude);
      const pLat = Number(p.latitude);
      const dLng = Number(d.longitude);
      const dLat = Number(d.latitude);

      if (isNaN(pLng) || isNaN(pLat) || isNaN(dLng) || isNaN(dLat)) {
        console.warn("Invalid coordinates for routing");
        return;
      }

      console.log("[Route] Fetching proxy routing from backend...");
      const data = await staffApi.getProxyRoute(`${pLng},${pLat}`, `${dLng},${dLat}`);

      if (data.code === 'Ok' && data.routes?.length > 0) {
        const route = data.routes[0];
        const mappedRoutes = [{
          distance: route.distance,
          duration: route.duration,
          coordinates: route.geometry.coordinates.map((c: any) => ({
            latitude: c[1],
            longitude: c[0]
          }))
        }];
        setRoutes(mappedRoutes);
      } else {
        console.warn("OSRM Proxy error:", data.code);
      }
    } catch (err: any) {
      console.warn("OSRM Routing Proxy error:", err.message);
    }
  };

  const fetchStatus = async () => {
    const invoiceId = route.params?.invoiceId;
    if (!invoiceId || invoiceId === "undefined") {
      console.error("Invalid invoiceId provided to OrderMapScreen");
      setLoading(false);
      return;
    }

    try {
      const result = await staffApi.getOrderDetails(invoiceId);
      const data = result.data || result;

      // Ưu tiên trạng thái của Assignment (phân công cá nhân) để các nút bấm hoạt động đúng
      const currentStatus = data.assignmentStatus || data.status || "PENDING";
      setStatus(currentStatus.toUpperCase());
      setOrderData(data);

      const p = normalizeLatLng(data.pickup?.coordinates);
      const d = normalizeLatLng(data.delivery?.coordinates);

      if (p && d) {
        setMapCoords({ pickup: p, delivery: d });

        // Always fetch journey routes from OSRM
        fetchRoutes(p, d);

        // If backend provided pre-defined restrictions or a custom polyline
        // (We don't setRoutes here because we want the dynamic OSRM route as the main one)
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // WebView handles auto-fitting internally

  const openExternalMap = () => {
    if (!orderData?.delivery?.coordinates) return;
    const { lat, lng } = orderData.delivery.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url).catch(() => Alert.alert("Lỗi", "Không thể mở ứng dụng bản đồ"));
  };

  const handleStatusUpdate = async (action: 'ACCEPT' | 'START' | 'COMPLETE') => {
    setActionLoading(true);
    try {
      if (!assignmentId) {
        throw new Error("Không tìm thấy ID phân công công việc.");
      }

      let newStatus = '';
      if (action === 'ACCEPT') newStatus = 'ACCEPTED';
      else if (action === 'START') newStatus = 'IN_PROGRESS';
      else if (action === 'COMPLETE') newStatus = 'COMPLETED';

      const result = await staffApi.updateAssignmentStatus(assignmentId, newStatus);

      if (result) {
        Alert.alert("Thành công", "Đã cập nhật trạng thái đơn hàng");
        fetchStatus(); // Refresh data
        if (action === 'COMPLETE') navigation.navigate("OrderList");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };

  const submitDeviation = async () => {
    if (!deviationReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do");
      return;
    }
    try {
      // For deviation, we can still use apiRequest or specific staffApi if added
      const result = await apiRequest(endpoints.staff.updateAssignmentRoute(assignmentId), {
        method: 'PATCH',
        body: JSON.stringify({ reason: deviationReason })
      });
      if (result.success) {
        Alert.alert("Thành công", "Đã báo cáo chuyển hướng về hệ thống");
        setIsModalVisible(false);
        setDeviationReason("");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi báo cáo");
    }
  };

  const renderActionButton = () => {
    if (actionLoading) return <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />;

    switch (status) {
      case "PENDING":
      case "ASSIGNED":
        return (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate('ACCEPT')}>
            <Text style={styles.actionBtnText}>NHẬN ĐƠN HÀNG</Text>
          </TouchableOpacity>
        );
      case "ACCEPTED":
      case "CONFIRMED":
        return (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#F59E0B" }]} onPress={() => handleStatusUpdate('START')}>
            <Text style={styles.actionBtnText}>BẮT ĐẦU DI CHUYỂN</Text>
          </TouchableOpacity>
        );
      case "IN_PROGRESS":
        return (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#22C55E" }]} onPress={() => handleStatusUpdate('COMPLETE')}>
            <Text style={styles.actionBtnText}>HOÀN TẤT GIAO HÀNG</Text>
          </TouchableOpacity>
        );
      default: {
        const displayStatus =
          status === "COMPLETED" ? "ĐÃ HOÀN TẤT" :
            status === "IN_PROGRESS" ? "ĐANG THỰC HIỆN" :
              status === "ACCEPTED" ? "ĐÃ NHẬN ĐƠN" : status;
        return (
          <View style={{ alignItems: 'center', padding: 10 }}>
            <Text style={{ color: colors.muted, fontStyle: 'italic' }}>Trạng thái: {displayStatus}</Text>
          </View>
        );
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const generateMapHtml = () => {
    const defaultCenter = [16.047079, 108.20623];
    const pickup = mapCoords?.pickup ? [mapCoords.pickup.latitude, mapCoords.pickup.longitude] : null;
    const delivery = mapCoords?.delivery ? [mapCoords.delivery.latitude, mapCoords.delivery.longitude] : null;

    const activeRouteCoordinates = routes[selectedRouteIdx]?.coordinates?.map((c: any) => [c.latitude, c.longitude]) || [];

    let backupPolyline: number[][] = [];
    if (routes.length === 0 && orderData?.polyline?.length > 0) {
      backupPolyline = orderData.polyline.map((p: any) => {
        const normalized = normalizeLatLng(p);
        return normalized ? [normalized.latitude, normalized.longitude] : [0, 0];
      });
    }

    const restrictedPaths: number[][][] = [];
    if (orderData?.restrictions?.length > 0) {
      // Restrictions from the assigned Route
      restrictedPaths.push(orderData.restrictions.map((p: any) => {
        const normalized = normalizeLatLng(p);
        return normalized ? [normalized.latitude, normalized.longitude] : [0, 0];
      }));
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; overflow: hidden; background: #e5e5e5; }
        #map { width: 100vw; height: 100vh; }
        .pickup-icon { background: #1D9BF0; border-radius: 50%; border: 2px solid white; width: 14px; height: 14px; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
        .delivery-icon { background: #EF4444; border-radius: 50%; border: 2px solid white; width: 14px; height: 14px; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var center = ${pickup ? JSON.stringify(pickup) : JSON.stringify(defaultCenter)};
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView(center, 13);
        
        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20
        }).addTo(map);

        var bounds = L.latLngBounds();

        var pickupCoord = ${JSON.stringify(pickup)};
        if (pickupCoord) {
            var iconP = L.divIcon({ className: 'pickup-icon', iconSize: [14, 14], iconAnchor: [7, 7] });
            L.marker(pickupCoord, { icon: iconP }).addTo(map).bindPopup("Điểm lấy hàng");
            bounds.extend(pickupCoord);
        }

        var deliveryCoord = ${JSON.stringify(delivery)};
        if (deliveryCoord) {
            var iconD = L.divIcon({ className: 'delivery-icon', iconSize: [14, 14], iconAnchor: [7, 7] });
            L.marker(deliveryCoord, { icon: iconD }).addTo(map).bindPopup("Điểm giao hàng");
            bounds.extend(deliveryCoord);
        }

        var activeRoute = ${JSON.stringify(activeRouteCoordinates)};
        if (activeRoute && activeRoute.length > 0) {
            L.polyline(activeRoute, {color: '#1D9BF0', weight: 5 }).addTo(map);
            bounds.extend(L.polyline(activeRoute).getBounds());
        }

        var backupRoute = ${JSON.stringify(backupPolyline)};
        if (backupRoute && backupRoute.length > 0 && activeRoute.length === 0) {
            L.polyline(backupRoute, {color: '#1D9BF0', weight: 4 }).addTo(map);
            bounds.extend(L.polyline(backupRoute).getBounds());
        }

        var restricted = ${JSON.stringify(restrictedPaths)};
        if (restricted && restricted.length > 0) {
            restricted.forEach(function(path) {
                L.polyline(path, {color: '#DC2626', weight: 8 }).addTo(map);
                bounds.extend(L.polyline(path).getBounds());
            });
        }

        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    </script>
</body>
</html>
    `;
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: generateMapHtml() }}
          style={{ flex: 1 }}
          scrollEnabled={false}
          bounces={false}
        />
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Lộ Trình Vận Chuyển</Text>
          <Text style={styles.headerSubtitle}>Đơn: {orderData?.orderCode || assignmentId.substring(0, 8)}</Text>
        </View>
      </View>

      {routes.length > 0 && (
        <View style={styles.routeSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
            {routes.map((r, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedRouteIdx(idx)}
                style={[styles.routeTab, selectedRouteIdx === idx && styles.activeRouteTab]}
              >
                <Text style={[styles.routeTabText, selectedRouteIdx === idx && styles.activeRouteTabText]}>Tuyến {idx + 1}</Text>
                <Text style={[styles.routeTabSub, selectedRouteIdx === idx && styles.activeRouteTabSub]}>{(r.distance / 1000).toFixed(1)}km</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.bottomSheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.sheetHandle} />
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>THỜI GIAN</Text>
              <Text style={styles.infoValue}>{routes.length > 0 ? Math.round(routes[selectedRouteIdx].duration / 60) : 25} phút</Text>
            </View>
            <View style={styles.vDivider} />
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>KHOẢNG CÁCH</Text>
              <Text style={styles.infoValue}>{routes.length > 0 ? (routes[selectedRouteIdx].distance / 1000).toFixed(1) : 5.0} km</Text>
            </View>
          </View>
          <View style={styles.addressSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="location" size={16} color="#EF4444" />
              <Text style={[styles.addrHeading, { marginLeft: 6 }]}>Giao: {orderData?.delivery?.address.split(',')[0]}</Text>
            </View>
            <Text style={styles.addrSub}>Từ: {orderData?.pickup?.address.split(',')[0]}</Text>
          </View>
          <TouchableOpacity style={styles.googleMapsBtn} onPress={openExternalMap}>
            <Ionicons name="navigate" size={18} color="#FFF" />
            <Text style={styles.googleMapsBtnText}>Mở bằng Google Maps</Text>
          </TouchableOpacity>
          {orderData?.routeValidation?.violations?.length > 0 && (
            <View style={styles.violationContainer}>
              <Text style={styles.violationTitle}>⚠️ Cảnh báo cấm đường:</Text>
              {orderData.routeValidation.violations.map((v: string, idx: number) => (
                <Text key={idx} style={styles.violationText}>• {v}</Text>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.deviateBtn} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.deviateBtnText}>⚠️ Báo Tắc Đường / Đổi Lộ Trình</Text>
          </TouchableOpacity>
          {renderActionButton()}
        </ScrollView>
      </View>

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Báo Cáo Sự Cố</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Lý do thay đổi lộ trình..."
              value={deviationReason}
              onChangeText={setDeviationReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={submitDeviation}>
                <Text style={styles.modalSubmitText}>Gửi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F0F0",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
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
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 15,
    borderRadius: radius.lg,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 1000,
  },
  routeSelector: {
    position: 'absolute',
    top: 135,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  routeTab: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  activeRouteTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  routeTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  activeRouteTabText: {
    color: '#FFF',
  },
  routeTabSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  activeRouteTabSub: {
    color: 'rgba(255,255,255,0.8)',
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
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: '60%',
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
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
    marginBottom: 20,
  },
  addrHeading: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
  },
  addrSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: "center",
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  actionBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
  },
  googleMapsBtn: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: 'center',
    marginBottom: 15,
    gap: 10,
  },
  googleMapsBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: "800",
  },
  deviateBtn: {
    backgroundColor: "#FEF2F2",
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: 15,
  },
  deviateBtnText: {
    color: "#DC2626",
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: radius.lg,
    width: "85%"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    color: colors.text
  },
  modalInput: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F3F4F6"
  },
  modalCancelText: {
    fontWeight: "700",
    color: colors.text
  },
  modalSubmitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444"
  },
  modalSubmitText: {
    fontWeight: "700",
    color: "#FFF"
  },
  violationContainer: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444"
  },
  violationTitle: {
    color: "#991B1B",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4
  },
  violationText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600"
  },
  warningTitle: {
    color: "#1E40AF",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4
  },
  warningText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "600"
  }
});

export default OrderMapScreen;