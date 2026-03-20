import React from "react";
import { Text, Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import LoginScreen from "./src/screens/auth/LoginScreen";
import ChangePasswordScreen from "./src/screens/auth/ChangePasswordScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import VerifyOTPScreen from "./src/screens/auth/VerifyOTPScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import { colors } from "./src/theme";
import StaffHomeScreen from "./src/screens/StaffHomeScreen.tsx";
import SettingsScreen from "./src/screens/SettingsScreen.tsx";
import EditProfileScreen from "./src/screens/EditProfileScreen.tsx";
import MyScheduleScreen from "./src/screens/MyScheduleScreen.tsx";
import MapPlaceholderScreen from "./src/screens/MapPlaceholderScreen.tsx";
import OrderListScreen from "./src/screens/OrderListScreen.tsx";
import OrderDetailsScreen from "./src/screens/OrderDetailsScreen.tsx";
import OrderMapScreen from "./src/screens/OrderMapScreen.tsx";

export type RootStackParamList = {
  Login: undefined;
  ChangePassword: undefined;
  ForgotPassword: undefined;
  VerifyOTP: { email?: string } | undefined;
  ResetPassword: undefined;
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

const tabActive = "#148BA5";
const tabInactive = "#9E9E9E";

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: tabActive,
      tabBarInactiveTintColor: tabInactive,
      tabBarStyle: { paddingTop: 14, paddingBottom: 20, height: 110 },
      tabBarLabel: ({ focused, color }) => (
        <Text
          style={{
            color,
            fontWeight: "700",
            fontSize: 22,
            marginBottom: 8,
          }}
        >
          {route.name === "TeamList"
            ? "Team List"
            : route.name === "Settings"
              ? "Setting"
              : "Home"}
        </Text>
      ),
      tabBarIcon: ({ color, size, focused }) => {
        let iconName: keyof typeof Ionicons.glyphMap = "home";
        if (route.name === "Home") iconName = focused ? "home" : "home-outline";
        else if (route.name === "TeamList")
          iconName = focused ? "people" : "people-outline";
        else iconName = focused ? "person" : "person-outline";
        const scale = focused ? 1.2 : 1;
        return (
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons
              name={iconName}
              size={(size ?? 34) + (focused ? 4 : 0)}
              color={color}
            />
          </Animated.View>
        );
      },
    })}
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
