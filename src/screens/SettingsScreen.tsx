import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../../App";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, endpoints } from "../api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const fallbackAvatar =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80";

type SettingsRoute = "EditProfile" | "ChangePassword" | "Login";

const options: Array<{
  id: string;
  label: string;
  desc: string;
  route?: SettingsRoute;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    id: "edit",
    label: "Edit Profile",
    desc: "Make changes to your Profile",
    route: "EditProfile" as const,
    icon: "person-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    id: "help",
    label: "Help & Support",
    desc: "",
    route: undefined,
    icon: "notifications-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    id: "about",
    label: "About App",
    desc: "",
    route: undefined,
    icon: "heart-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    id: "password",
    label: "Change Password",
    desc: "",
    route: "ChangePassword" as const,
    icon: "lock-closed-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    id: "logout",
    label: "Log out",
    desc: "",
    route: "Login" as const,
    icon: "log-out-outline" as keyof typeof Ionicons.glyphMap,
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.notifyCircle}>
            <Text style={styles.notifyIcon}>🔔</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
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
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {user?.fullName || user?.username || "Staff"}
            </Text>
            <Text style={styles.email}>{user?.email || "No email"}</Text>
            <Text style={styles.phone}>
              {user?.phone || user?.phoneNumber || "No phone"}
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {options.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.item}
              onPress={() => handlePress(item.route)}
            >
              <View style={styles.itemLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon} size={26} color={colors.primary} />
                </View>
                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  {item.desc ? (
                    <Text style={styles.itemDesc}>{item.desc}</Text>
                  ) : null}
                </View>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={22}
                color={colors.muted}
              />
            </TouchableOpacity>
          ))}
        </View>

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
    paddingHorizontal: spacing.xl + 6,
    paddingVertical: spacing.xl + 6,
    gap: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  notifyCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  notifyIcon: {
    fontSize: 22,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E6F4EA",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  email: {
    color: colors.primary,
    marginTop: 4,
    fontSize: 17,
  },
  phone: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 17,
  },
  list: {
    gap: spacing.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F3F5",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTextWrap: {
    gap: 4,
  },
  itemLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 20,
  },
  itemDesc: {
    color: colors.muted,
    fontSize: 16,
  },
});

export default SettingsScreen;
