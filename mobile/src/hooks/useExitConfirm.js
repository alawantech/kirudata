import { useRef } from "react";
import { BackHandler, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Shows "Exit app?" confirmation ONLY when the screen is focused.
 * No flag needed — the token is memory-only so killing the process
 * automatically drops the session.
 */
export function useExitConfirm() {
  const prompted = useRef(false);

  useFocusEffect(() => {
    const onBack = () => {
      if (prompted.current) return true;
      prompted.current = true;
      Alert.alert(
        "Exit App",
        "Are you sure you want to exit?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              prompted.current = false;
            },
          },
          {
            text: "Exit",
            style: "destructive",
            onPress: () => {
              prompted.current = false;
              BackHandler.exitApp();
            },
          },
        ],
        {
          cancelable: true,
          onDismiss: () => {
            prompted.current = false;
          },
        },
      );
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  });
}
