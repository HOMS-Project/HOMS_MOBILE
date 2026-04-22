import "react-native-reanimated";
import "./global.css";
import React, { useEffect, useRef, useState } from "react";
import { Text, View, Pressable, Animated, Easing } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import LoginScreen from "./src/screens/auth/LoginScreen";
import ChangePasswordScreen from "./src/screens/auth/ChangePasswordScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import VerifyOTPScreen from "./src/screens/auth/VerifyOTPScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import { colors } from "./src/theme";
import StaffHomeScreen from "./src/screens/StaffHomeScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import MyScheduleScreen from "./src/screens/MyScheduleScreen";
import OrderListScreen from "./src/screens/OrderListScreen";
import OrderDetailsScreen from "./src/screens/OrderDetailsScreen";
import OrderMapScreen from "./src/screens/OrderMapScreen";
import NotificationScreen from "./src/screens/NotificationScreen";
import TeamListScreen from "./src/screens/TeamListScreen";
import TeamDetailScreen from "./src/screens/TeamDetailScreen";
import IncidentListScreen from "./src/screens/IncidentListScreen";
import CreateIncidentScreen from "./src/screens/CreateIncidentScreen";
import { loadAuthToken } from "./src/api";

export type RootStackParamList = {
  Login: undefined;
  ChangePassword: undefined;
  ForgotPassword: undefined;
  VerifyOTP: { email?: string } | undefined;
  ResetPassword: { email?: string } | undefined;
  MainTabs: undefined;
  EditProfile: undefined;
  TeamList: undefined;
  OrderList: { fromTeamDetail?: boolean } | undefined;
  OrderDetails: { invoiceId: string };
  OrderMap: { assignmentId: string; invoiceId: string };
  TeamDetail: { invoiceId: string };
  IncidentList: undefined;
  CreateIncident: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  MySchedule: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const tabActive = "#1F7A3D";
const tabInactive = "#8A8A8A";

const tabMeta: Record<
  keyof MainTabParamList,
  {
    label: string;
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
  }
> = {
  Home: {
    label: "Trang chủ",
    activeIcon: "home",
    inactiveIcon: "home-outline",
  },
  MySchedule: {
    label: "Lịch của tôi",
    activeIcon: "calendar",
    inactiveIcon: "calendar-outline",
  },
  Settings: {
    label: "Cài đặt",
    activeIcon: "person",
    inactiveIcon: "person-outline",
  },
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const [barWidth, setBarWidth] = useState(0);
  const indicatorTranslateX = useRef(new Animated.Value(0)).current;
  const iconScaleAnims = useRef(
    state.routes.map(
      (_, index) => new Animated.Value(state.index === index ? 1.1 : 1),
    ),
  ).current;
  const iconLiftAnims = useRef(
    state.routes.map(
      (_, index) => new Animated.Value(state.index === index ? -3 : 0),
    ),
  ).current;

  useEffect(() => {
    if (!barWidth) return;

    const tabWidth = barWidth / state.routes.length;
    Animated.timing(indicatorTranslateX, {
      toValue: tabWidth * state.index,
      duration: 460,
      easing: Easing.bezier(0.2, 0.9, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [barWidth, state.index, state.routes.length, indicatorTranslateX]);

  useEffect(() => {
    const animations = state.routes.flatMap((_, index) => {
      const focused = state.index === index;
      return [
        Animated.spring(iconScaleAnims[index], {
          toValue: focused ? 1.12 : 1,
          friction: 7,
          tension: 95,
          useNativeDriver: true,
        }),
        Animated.spring(iconLiftAnims[index], {
          toValue: focused ? -4 : 0,
          friction: 8,
          tension: 90,
          useNativeDriver: true,
        }),
      ];
    });

    Animated.parallel(animations).start();
  }, [state.index, state.routes, iconScaleAnims, iconLiftAnims]);

  return (
    <View
      className="absolute bottom-0 left-0 right-0 items-center pb-[30px]"
      pointerEvents="box-none"
    >
      <View
        className="h-[86px] w-[94%] flex-row items-center justify-between rounded-full bg-[#F2F7F2] px-[10px] py-[7px]"
        onLayout={(event) => {
          setBarWidth(event.nativeEvent.layout.width - 20);
        }}
        style={{
          maxWidth: 500,
          elevation: 12,
          shadowColor: "#0F172A",
          shadowOpacity: 0.14,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 7 },
          position: "relative",
        }}
      >
        {barWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 10,
              top: 7,
              width: barWidth / state.routes.length,
              height: 64,
              borderRadius: 32,
              backgroundColor: tabActive,
              transform: [{ translateX: indicatorTranslateX }],
              shadowColor: "#166534",
              shadowOpacity: 0.22,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
              elevation: 0,
              zIndex: 0,
            }}
          />
        )}

        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const routeName = route.name as keyof MainTabParamList;
          const { label, activeIcon, inactiveIcon } = tabMeta[routeName];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className="mx-1 h-16 flex-1 items-center justify-center rounded-[32px]"
              style={{
                position: "relative",
                zIndex: 2,
              }}
            >
              <Animated.View
                style={{
                  transform: [
                    { translateY: iconLiftAnims[index] },
                    { scale: iconScaleAnims[index] },
                  ],
                }}
              >
                <Ionicons
                  name={focused ? activeIcon : inactiveIcon}
                  size={34}
                  color={focused ? "#FFFFFF" : tabInactive}
                />
              </Animated.View>
              <Text
                className={`mt-[2px] text-[11px] font-bold leading-[13px] ${focused ? "text-white" : "text-[#8A8A8A]"}`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <CustomTabBar {...props} />}
  >
    <Tab.Screen name="Home" component={StaffHomeScreen} />
    <Tab.Screen name="MySchedule" component={MyScheduleScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>("Login");

  useEffect(() => {
    const initApp = async () => {
      const token = await loadAuthToken();
      if (token) {
        setInitialRoute("MainTabs");
      }
      setIsReady(true);
    };
    initApp();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ marginTop: 20 }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="TeamList" component={TeamListScreen} />
        <Stack.Screen
          name="OrderList"
          component={OrderListScreen}
          options={({ route }) => ({
            animation: route.params?.fromTeamDetail
              ? "slide_from_bottom"
              : "slide_from_right",
          })}
        />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="OrderMap" component={OrderMapScreen} />
        <Stack.Screen name="TeamDetail" component={TeamDetailScreen} />
        <Stack.Screen name="IncidentList" component={IncidentListScreen} />
        <Stack.Screen name="CreateIncident" component={CreateIncidentScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
