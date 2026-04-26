import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Data ──────────────────────────────────────────────────────────────────────

const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "2026.04";

const features: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}> = [
  {
    icon: "map-outline",
    title: "Theo dõi đơn hàng thời gian thực",
    desc: "Xem vị trí và trạng thái đơn hàng ngay trên bản đồ trực tiếp.",
  },
  {
    icon: "notifications-outline",
    title: "Thông báo tức thì",
    desc: "Nhận ngay thông báo khi có đơn mới, cập nhật hoặc yêu cầu khẩn.",
  },
  {
    icon: "calendar-outline",
    title: "Lịch làm việc cá nhân",
    desc: "Quản lý toàn bộ các ca và chuyến trong ngày một cách trực quan.",
  },
  {
    icon: "camera-outline",
    title: "Chụp ảnh & Xác nhận giao hàng",
    desc: "Ghi lại bằng chứng giao hàng hoặc sự cố ngay tại hiện trường.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Bảo mật phiên đăng nhập",
    desc: "Tự động gia hạn session, bảo vệ tài khoản với cơ chế token an toàn.",
  },
  {
    icon: "location-outline",
    title: "GPS tự động",
    desc: "Hệ thống phát tín hiệu vị trí liên tục, hỗ trợ điều phối chính xác.",
  },
];

const contacts: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  action?: () => void;
}> = [
  {
    icon: "globe-outline",
    label: "Website",
    value: "homs.vn",
    action: () => Linking.openURL("https://homs.vn"),
  },
  {
    icon: "mail-outline",
    label: "Email hỗ trợ",
    value: "support@homs.vn",
    action: () => Linking.openURL("mailto:support@homs.vn"),
  },
  {
    icon: "call-outline",
    label: "Hotline",
    value: "1800 xxxx",
    action: () => Linking.openURL("tel:1800xxxx"),
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

const FeatureCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  delay: number;
}> = ({ icon, title, desc, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }] }}
      className="mb-3 flex-row items-start gap-3 rounded-xl border border-emerald-100 bg-white p-3.5"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
        <Ionicons name={icon} size={18} color="#059669" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-slate-800">{title}</Text>
        <Text className="mt-0.5 text-xs leading-5 text-slate-500">{desc}</Text>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

const AboutScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerOpacity, headerScale]);

  return (
    <View style={{ flex: 1, backgroundColor: "#edf4ef" }}>
      {/* Decorative blobs */}
      <View
        style={{
          position: "absolute",
          right: -80,
          top: -80,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: "rgba(167,243,208,0.35)",
        }}
      />
      <View
        style={{
          position: "absolute",
          left: -60,
          bottom: 80,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "rgba(186,230,253,0.3)",
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── Top Nav ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 52,
            paddingBottom: 4,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 16,
              fontWeight: "700",
              color: "#0f172a",
              marginRight: 36,
            }}
          >
            Về ứng dụng
          </Text>
        </View>

        {/* ── Hero Card ── */}
        <Animated.View
          style={{
            opacity: headerOpacity,
            transform: [{ scale: headerScale }],
            marginHorizontal: 16,
            marginTop: 8,
            borderRadius: 28,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#0f3f2a", "#156f45", "#1da862"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 22, paddingBottom: 26 }}
          >
            {/* Logo placeholder */}
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="cube-outline" size={32} color="#fff" />
            </View>

            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: "#fff",
                letterSpacing: -0.5,
              }}
            >
              HOMS Driver
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.75)",
                marginTop: 4,
                fontWeight: "500",
              }}
            >
              Home Operations Management System
            </Text>

            {/* Version badge */}
            <View
              style={{
                marginTop: 20,
                flexDirection: "row",
                gap: 10,
              }}
            >
              <View
                style={{
                  borderRadius: 100,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Ionicons
                  name="rocket-outline"
                  size={14}
                  color="rgba(255,255,255,0.85)"
                />
                <Text
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Phiên bản {APP_VERSION}
                </Text>
              </View>
              <View
                style={{
                  borderRadius: 100,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.25)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  Build {BUILD_NUMBER}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Giới thiệu ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Giới thiệu
          </Text>
          <View
            style={{
              borderRadius: 16,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#d1fae5",
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                lineHeight: 22,
                color: "#475569",
              }}
            >
              <Text style={{ fontWeight: "700", color: "#0f3f2a" }}>
                HOMS Driver
              </Text>{" "}
              là ứng dụng di động dành riêng cho đội ngũ tài xế của hệ thống{" "}
              <Text style={{ fontWeight: "700", color: "#059669" }}>HOMS</Text>{" "}
              — nền tảng quản lý vận hành nội địa thông minh.
              {"\n\n"}
              Ứng dụng giúp tài xế nhận đơn hàng, theo dõi lịch trình, giao
              tiếp với điều phối viên và ghi nhận bằng chứng giao hàng — tất cả
              trong một giao diện đơn giản, nhanh chóng và đáng tin cậy.
            </Text>
          </View>
        </View>

        {/* ── Tính năng ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            Tính năng chính
          </Text>
          {features.map((f, i) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              desc={f.desc}
              delay={i * 60}
            />
          ))}
        </View>
        {/* ── Footer ── */}
        <View style={{ alignItems: "center", marginTop: 32, paddingBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#10b981",
              }}
            />
            <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "500" }}>
              Made in Vietnam 🇻🇳
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: "#94a3b8" }}>
            © {new Date().getFullYear()} HOMS. All rights reserved.
          </Text>
          <Text style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4 }}>
            v{APP_VERSION} · Build {BUILD_NUMBER}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default AboutScreen;
