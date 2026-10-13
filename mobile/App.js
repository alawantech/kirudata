import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { AuthProvider } from "./src/context/AuthContext";
import { OverlayProvider } from "./src/context/OverlayContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <OverlayProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <Toast />
        </AuthProvider>
      </OverlayProvider>
    </SafeAreaProvider>
  );
}
