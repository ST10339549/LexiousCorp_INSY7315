import React from "react";
import { NativeBaseProvider, extendTheme } from "native-base";
import { SafeAreaView } from "react-native";

// Simplified inline theme to avoid import issues
const crecheTheme = extendTheme({
  colors: {
    primary: {
      50: '#E8F0FF',
      100: '#C2D9FF',
      200: '#9BC2FF',
      300: '#75ABFF',
      400: '#5C8DFF',
      500: '#5C8DFF',
      600: '#4A71CC',
      700: '#385599',
      800: '#263966',
      900: '#141D33',
    },
    accent: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#A78BFA',
      600: '#8B5CF6',
      700: '#7C3AED',
      800: '#6D28D9',
      900: '#5B21B6',
    },
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#4CC38A',
      500: '#4CC38A',
      600: '#10B981',
      700: '#059669',
      800: '#047857',
      900: '#065F46',
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    warning: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
    info: {
      50: '#ECFEFF',
      100: '#CFFAFE',
      200: '#A5F3FC',
      300: '#67E8F9',
      400: '#22D3EE',
      500: '#06B6D4',
      600: '#0891B2',
      700: '#0E7490',
      800: '#155E75',
      900: '#164E63',
    },
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#2D2D2D',
      900: '#111827',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F7F9FC',
      tertiary: '#F3F4F6',
    },
  },
});

export default function AppContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NativeBaseProvider theme={crecheTheme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F9FC" }}>
        {children}
      </SafeAreaView>
    </NativeBaseProvider>
  );
}
