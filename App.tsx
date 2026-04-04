import "react-native-reanimated";
import "./global.css";
import React from "react";
import { Text, View, Pressable } from "react-native";
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
import MapPlaceholderScreen from "./src/screens/MapPlaceholderScreen";
import OrderListScreen from "./src/screens/OrderListScreen";
import OrderDetailsScreen from "./src/screens/OrderDetailsScreen";
import OrderMapScreen from "./src/screens/OrderMapScreen";

export type RootStackParamList = {
  Login: undefined;
  ChangePassword: undefined;
  ForgotPassword: undefined;
  VerifyOTP: { email?: string } | undefined;
  ResetPassword: { email?: string } | undefined;
  MainTabs: undefined;
  EditProfile: undefined;
  MySchedule: undefined;
  OrderList: undefined;
  OrderDetails: { invoiceId: string };
  OrderMap: { assignmentId: string; invoiceId: string };
};

export type MainTabParamList = {
  Home: undefined;
  TeamList: undefined;
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
    label: "Home",
    activeIcon: "home",
    inactiveIcon: "home-outline",
  },
  TeamList: {
    label: "Team List",
    activeIcon: "people",
    inactiveIcon: "people-outline",
  },
  Settings: {
    label: "Setting",
    activeIcon: "person",
    inactiveIcon: "person-outline",
  },
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 px-[22px] pb-[14px]"
      pointerEvents="box-none"
    >
      <View
        className="h-[86px] flex-row items-center justify-between rounded-full bg-[#F2F7F2] px-[10px] py-[7px]"
        style={{
          elevation: 12,
          shadowColor: "#0F172A",
          shadowOpacity: 0.14,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 7 },
        }}
      >
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
              className={`mx-1 h-16 flex-1 items-center justify-center rounded-[32px] ${focused ? "bg-[#1F7A3D]" : ""}`}
            >
              <Ionicons
                name={focused ? activeIcon : inactiveIcon}
                size={34}
                color={focused ? "#FFFFFF" : tabInactive}
              />
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
    <Tab.Screen name="TeamList" component={MapPlaceholderScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Login"
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
        <Stack.Screen name="MySchedule" component={MyScheduleScreen} />
        <Stack.Screen name="OrderList" component={OrderListScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="OrderMap" component={OrderMapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
