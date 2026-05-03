import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Svg, G, Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from "react-native-svg";
import { apiRequest, endpoints } from "../api";
import Card from "../components/ui/Card";

const Counter = ({ value, colors }: { value: number; colors: string[] }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <View className="h-10 w-16">
      <Svg height="40" width="80">
        <Defs>
          <SvgGradient id={`grad-${colors[0]}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={colors[1]} stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <SvgText
          fill={`url(#grad-${colors[0]})`}
          fontSize="28"
          fontWeight="900"
          x="0"
          y="30"
        >
          {displayValue}
        </SvgText>
      </Svg>
    </View>
  );
};

const { width } = Dimensions.get("window");

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiRequest(endpoints.staff.getStats);
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Fetch stats failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  const renderStatCard = (label: string, value: number, icon: any, color: string, gradient: string[]) => (
    <View 
      className="flex-1 mb-5"
      style={{
        shadowColor: "#ffffff",
        shadowOffset: { width: -4, height: -4 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View 
        className="rounded-[32px] p-5"
        style={{
          backgroundColor: "#f8fafc",
          shadowColor: "#cbd5e1",
          shadowOffset: { width: 6, height: 6 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <Counter value={value} colors={gradient} />
        </View>
        <Text className="mt-4 text-[10px] font-black uppercase tracking-[2px] text-slate-400">
          {label}
        </Text>
      </View>
    </View>
  );

  const renderPieChart = () => {
    if (!stats || !stats.byType) return null;
    const data = [
      { key: "FULL_HOUSE", value: stats.byType.FULL_HOUSE || 0, color: "#3b82f6", label: "Chuyển nhà" },
      { key: "TRUCK_RENTAL", value: stats.byType.TRUCK_RENTAL || 0, color: "#f97316", label: "Thuê xe" },
      { key: "SPECIFIC_ITEMS", value: stats.byType.SPECIFIC_ITEMS || 0, color: "#a855f7", label: "Chuyển đồ" },
    ].filter((d) => d.value > 0);

    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) {
      return (
        <Card className="mt-2 items-center justify-center rounded-3xl border border-slate-100 bg-white p-10 shadow-sm">
          <Ionicons name="pie-chart-outline" size={48} color="#e2e8f0" />
          <Text className="mt-2 font-bold text-slate-400">
            Chưa có dữ liệu phân loại
          </Text>
        </Card>
      );
    }

    let cumulativeAngle = 0;
    const radius = 60;
    const strokeWidth = 25;
    const center = 80;

    return (
      <View className="mt-8 items-center">
        <Text className="mb-6 text-base font-extrabold text-slate-900">
          Phân loại đơn hàng
        </Text>
        
        <View className="h-48 w-48 items-center justify-center">
          <Svg width="192" height="192" viewBox="0 0 160 160">
            <G transform={`translate(${center}, ${center}) rotate(-90)`}>
              {data.map((slice, index) => {
                const angle = (slice.value / total) * 360;
                const x1 = radius * Math.cos((cumulativeAngle * Math.PI) / 180);
                const y1 = radius * Math.sin((cumulativeAngle * Math.PI) / 180);
                cumulativeAngle += angle;
                const x2 = radius * Math.cos((cumulativeAngle * Math.PI) / 180);
                const y2 = radius * Math.sin((cumulativeAngle * Math.PI) / 180);

                const largeArcFlag = angle > 180 ? 1 : 0;
                const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

                return (
                  <Path
                    key={index}
                    d={d}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                );
              })}
            </G>
          </Svg>
          <View className="absolute items-center justify-center">
            <Counter value={total} colors={["#0f172a", "#475569"]} />
            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">
              Tổng đơn
            </Text>
          </View>
        </View>

        <View className="mt-8 flex-row justify-center gap-8 px-4">
          {data.map((slice, i) => (
            <View key={i} className="items-center">
              <View className="flex-row items-center mb-1">
                <View
                  className="mr-1.5 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <Text className="text-[11px] font-bold text-slate-500">
                  {slice.label}
                </Text>
              </View>
              <Text className="text-lg font-black text-slate-900">
                {slice.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#f8fafc]">
      <LinearGradient
        colors={["#0f3f2a", "#1d8a55"]}
        className="pt-12 pb-6 px-5 rounded-b-[32px]"
      >
        <View className="flex-row items-center">
          <Pressable 
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white/20"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          <Text className="ml-4 text-xl font-black text-white">Bảng điều khiển</Text>
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <ScrollView 
          className="flex-1 px-5 pt-6" 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="flex-row gap-4 mb-2">
            {renderStatCard("Đã xong", stats?.completed || 0, "checkmark-done", "#10b981", ["#10b981", "#059669"])}
            {renderStatCard("Đang làm", stats?.inProgress || 0, "play", "#3b82f6", ["#3b82f6", "#2563eb"])}
          </View>
          <View className="flex-row gap-4">
            {renderStatCard("Chờ xử lý", stats?.assigned || 0, "time", "#8b5cf6", ["#8b5cf6", "#7c3aed"])}
            {renderStatCard("Sự cố", stats?.incidents || 0, "alert-circle", "#f59e0b", ["#f59e0b", "#d97706"])}
          </View>
          {renderPieChart()}
        </ScrollView>
      )}
    </View>
  );
};

export default DashboardScreen;
