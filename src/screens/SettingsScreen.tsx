import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { type RootStackParamList } from "../../App";
import { apiRequest, endpoints, setAuthToken } from "../api";
import { useTabBar } from "../contexts/TabBarContext";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SettingsRoute = "EditProfile" | "ChangePassword" | "Login" | "About";

const fallbackAvatar =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80";

const options: Array<{
  id: string;
  label: string;
  desc: string;
  route?: SettingsRoute;
  icon: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
}> = [
  {
    id: "edit",
    label: "Chỉnh sửa hồ sơ",
    desc: "Cập nhật thông tin cá nhân",
    route: "EditProfile",
    icon: "person-outline",
  },
  {
    id: "password",
    label: "Đổi mật khẩu",
    desc: "Tăng bảo mật tài khoản",
    route: "ChangePassword",
    icon: "shield-checkmark-outline",
  },
  {
    id: "about",
    label: "Về ứng dụng",
    desc: "HOMS Driver v1.0.0",
    route: "About",
    icon: "information-circle-outline",
  },
  {
    id: "logout",
    label: "Đăng xuất",
    desc: "Thoát khỏi tài khoản hiện tại",
    route: "Login",
    icon: "log-out-outline",
    danger: true,
  },
];

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // ── Tab bar visibility (Grab-style) ────────────────────────────────
  const { setTabBarVisible } = useTabBar();
  const lastScrollY = useRef(0);
  const scrollDir = useRef<"up" | "down">("up");

  const fetchProfile = async () => {
    try {
      const result = await apiRequest(endpoints.user.getProfile);
      if (result.success) {
        setUser(result.data);
      }
    } catch (error) {
      console.error("Fetch profile failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      setTabBarVisible(true);
      lastScrollY.current = 0;
      scrollDir.current = "up";
      return () => { setTabBarVisible(true); };
    }, [setTabBarVisible]),
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastScrollY.current;
    lastScrollY.current = y;
    if (Math.abs(dy) < 4) return;
    const dir = dy > 0 ? "down" : "up";
    if (dir !== scrollDir.current) {
      scrollDir.current = dir;
      setTabBarVisible(dir === "up");
    }
  };

  const handlePress = async (route?: SettingsRoute) => {
    if (!route) return;
    if (route === "Login") {
      await setAuthToken(null);
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      return;
    }
    navigation.navigate(route);
  };

  return (
    <View className="flex-1 bg-[#edf4ef]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-4 pb-3 pt-12">
          <Text className="text-2xl font-extrabold text-slate-900">
            Cài đặt
          </Text>
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications" size={22} color="#0f172a" />
          </Pressable>
        </View>

        {/* ── Profile (no card) ── */}
        <View className="mt-8 items-center">
          <View
            className="h-32 w-32 overflow-hidden rounded-full border-4 border-emerald-200 bg-slate-200"
            style={{
              shadowColor: "#16A34A",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#16A34A" />
              </View>
            ) : (
              <Image
                source={{ uri: user?.avatar || fallbackAvatar }}
                className="h-32 w-32"
                resizeMode="cover"
              />
            )}
          </View>

          <Text className="mt-4 text-xl font-extrabold text-slate-900">
            {user?.fullName || user?.username || "Tài xế"}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            {user?.email || "Chưa có email"}
          </Text>
          <Text className="mt-0.5 text-sm text-slate-500">
            {user?.phone || user?.phoneNumber || "Chưa có số điện thoại"}
          </Text>
        </View>

        {/* ── Menu Items (no card, centred, smaller padding) ── */}
        <View className="mt-8 items-center gap-4 px-6">
          {options.map((item) => (
            <Pressable
              key={item.id}
              className="w-full flex-row items-center py-2"
              onPress={() => handlePress(item.route)}
            >
              {/* Circle icon — #16A34A green */}
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{
                  backgroundColor: item.danger ? "#fee2e2" : "#16A34A",
                  shadowColor: item.danger ? "#ef4444" : "#16A34A",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.danger ? "#ef4444" : "#ffffff"}
                />
              </View>

              {/* Label & desc */}
              <View className="ml-3 flex-1">
                <Text
                  className="text-base font-bold"
                  style={{ color: item.danger ? "#ef4444" : "#0f172a" }}
                >
                  {item.label}
                </Text>
                <Text className="text-sm text-slate-400">{item.desc}</Text>
              </View>

              {/* Chevron */}
              <Ionicons
                name="chevron-forward"
                size={18}
                color={item.danger ? "#fca5a5" : "#94a3b8"}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
