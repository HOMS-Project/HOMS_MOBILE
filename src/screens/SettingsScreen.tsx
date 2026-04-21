import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "../../App";
import { apiRequest, endpoints } from "../api";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SettingsRoute = "EditProfile" | "ChangePassword" | "Login";

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
    id: "help",
    label: "Trợ giúp và hỗ trợ",
    desc: "Liên hệ bộ phận vận hành",
    icon: "chatbubble-ellipses-outline",
  },
  {
    id: "about",
    label: "Về ứng dụng",
    desc: "HOMS Driver v1",
    icon: "information-outline",
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
    }, []),
  );

  const handlePress = (route?: SettingsRoute) => {
    if (!route) return;
    if (route === "Login") {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      return;
    }
    navigation.navigate(route);
  };

  return (
    <View className="flex-1 bg-[#edf4ef]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-5 pb-4 pt-14">
          <Text className="text-4xl font-extrabold text-slate-900">
            Cài đặt
          </Text>
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#0f172a" />
          </Pressable>
        </View>

        {/* ── Profile (no card) ── */}
        <View className="mt-14 items-center">
          <View
            className="h-48 w-48 overflow-hidden rounded-full border-4 border-emerald-200 bg-slate-200"
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
                <ActivityIndicator color="#16A34A" size="large" />
              </View>
            ) : (
              <Image
                source={{ uri: user?.avatar || fallbackAvatar }}
                className="h-48 w-48"
                resizeMode="cover"
              />
            )}
          </View>

          <Text className="mt-6 text-[38px] font-extrabold text-slate-900">
            {user?.fullName || user?.username || "Tài xế"}
          </Text>
          <Text className="mt-2.5 text-lg text-slate-500">
            {user?.email || "Chưa có email"}
          </Text>
          <Text className="mt-1.5 text-lg text-slate-500">
            {user?.phone || user?.phoneNumber || "Chưa có số điện thoại"}
          </Text>
        </View>

        {/* ── Menu Items (no card, centred, smaller padding) ── */}
        <View className="mt-10 items-center gap-7 px-20">
          {options.map((item) => (
            <Pressable
              key={item.id}
              className="w-full flex-row items-center py-1"
              onPress={() => handlePress(item.route)}
            >
              {/* Circle icon — #16A34A green */}
              <View
                className="h-14 w-14 items-center justify-center rounded-full"
                style={{
                  backgroundColor: item.danger ? "#fee2e2" : "#16A34A",
                  shadowColor: item.danger ? "#ef4444" : "#16A34A",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={item.danger ? "#ef4444" : "#ffffff"}
                />
              </View>

              {/* Label & desc */}
              <View className="ml-4 flex-1">
                <Text
                  className="text-2xl font-bold"
                  style={{ color: item.danger ? "#ef4444" : "#0f172a" }}
                >
                  {item.label}
                </Text>
                <Text className="text-lg text-slate-400">{item.desc}</Text>
              </View>

              {/* Chevron */}
              <Ionicons
                name="chevron-forward"
                size={20}
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
