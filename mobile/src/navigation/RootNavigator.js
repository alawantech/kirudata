import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { AuthStack, AppStack } from "./AppNavigator";

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0918",
        }}
      >
        <ActivityIndicator size="large" color="#5B4FE9" />
      </View>
    );
  }

  return user ? <AppStack /> : <AuthStack />;
}
