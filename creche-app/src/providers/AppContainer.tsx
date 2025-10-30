import React from "react";
import { NativeBaseProvider, extendTheme } from "native-base";
import { SafeAreaView } from "react-native";

const theme = extendTheme({
  colors: {
    brand: {
      500: "#3a67ff", // primary blue to match the welcome screen button
    },
    bg: {
      900: "#101010",
      800: "#1f1f1f",
      700: "#2a2a2a",
    },
  },
});

export default function AppContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NativeBaseProvider theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#101010" }}>
        {children}
      </SafeAreaView>
    </NativeBaseProvider>
  );
}
