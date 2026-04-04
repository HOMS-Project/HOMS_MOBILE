import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "../../App";
import Card from "../components/ui/Card";
import Section from "../components/ui/Section";
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
}> = [
  {
    id: "edit",
    label: "Chỉnh sửa hồ sơ",
    desc: "Cập nhật thông tin cá nhân",
    route: "EditProfile",
    icon: "person-circle-outline",
  },
  {
    id: "password",
    label: "Đổi mật khẩu",
    desc: "Tăng bảo mật tài khoản",
    route: "ChangePassword",
    icon: "lock-closed-outline",
  },
  {
    id: "help",
    label: "Trợ giúp và hỗ trợ",
    desc: "Liên hệ bộ phận vận hành",
    icon: "help-circle-outline",
  },
  {
    id: "about",
    label: "Về ứng dụng",
    desc: "HOMS Driver v1",
    icon: "information-circle-outline",
  },
  {
    id: "logout",
    label: "Đăng xuất",
    desc: "Thoát khỏi tài khoản hiện tại",
    route: "Login",
    icon: "log-out-outline",
  },
];

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isFocused) {
      fetchProfile();
    }
  }, [isFocused]);

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

  const handlePress = (route?: SettingsRoute) => {
    if (!route) return;
    if (route === "Login") {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      return;
    }
    navigation.navigate(route);
  };

  return (
    <View className="flex-1 bg-slate-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-5 pt-14">
          <View className="flex-row items-center justify-between">
            <Text className="text-3xl font-extrabold text-slate-900">
              Cài đặt
            </Text>
            <Pressable className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#0f172a"
              />
            </Pressable>
          </View>

          <Card className="mt-6 rounded-[30px] p-6">
            <View className="items-center">
              <View className="h-24 w-24 overflow-hidden rounded-full border-4 border-emerald-100 bg-slate-200">
                {loading ? (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#0f766e" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: user?.avatar || fallbackAvatar }}
                    className="h-24 w-24"
                  />
                )}
              </View>

              <Text className="mt-4 text-xl font-extrabold text-slate-900">
                {user?.fullName || user?.username || "Tài xế"}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                {user?.email || "Chưa có email"}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                {user?.phone || user?.phoneNumber || "Chưa có số điện thoại"}
              </Text>

              <Pressable
                className="mt-4 rounded-full bg-emerald-500 px-5 py-2"
                onPress={() => navigation.navigate("EditProfile")}
              >
                <Text className="text-sm font-bold text-white">
                  Chỉnh sửa hồ sơ
                </Text>
              </Pressable>
            </View>
          </Card>

          <Section title="Tùy chọn" />

          <View className="gap-3">
            {options.map((item) => (
              <Pressable
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                onPress={() => handlePress(item.route)}
              >
                <View className="flex-row items-center">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <Ionicons name={item.icon} size={21} color="#0f766e" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold text-slate-900">
                      {item.label}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-500">
                      {item.desc}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={20}
                    color="#94a3b8"
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
