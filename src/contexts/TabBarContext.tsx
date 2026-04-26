/**
 * TabBarContext
 *
 * Shares a single Animated.Value between:
 *  - StaffHomeScreen (producer — drives the value on scroll)
 *  - CustomTabBar    (consumer — translates itself based on the value)
 *
 * The value represents vertical translation of the tab bar:
 *   0   → fully visible (normal position)
 *   150 → slid down / hidden
 */

import React, { createContext, useContext, useRef } from "react";
import { Animated } from "react-native";

interface TabBarContextValue {
  /** 0 = visible, ~150 = hidden below screen */
  tabBarTranslateY: Animated.Value;
  /** Call with true to hide, false to show */
  setTabBarVisible: (visible: boolean) => void;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);

export const TabBarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  const setTabBarVisible = (visible: boolean) => {
    Animated.spring(tabBarTranslateY, {
      toValue: visible ? 0 : 150,
      useNativeDriver: true,
      friction: 10,
      tension: 80,
    }).start();
  };

  return (
    <TabBarContext.Provider value={{ tabBarTranslateY, setTabBarVisible }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = (): TabBarContextValue => {
  const ctx = useContext(TabBarContext);
  if (!ctx) throw new Error("useTabBar must be used inside <TabBarProvider>");
  return ctx;
};
