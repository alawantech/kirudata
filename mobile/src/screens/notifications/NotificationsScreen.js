import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import client from "../../api/client";
import { Header } from "../../components/Header";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";

function NotifItem({ item }) {
  return (
    <View activeOpacity={0.8} style={styles.notifCard}>
      <View style={styles.iconBox}>
        <Ionicons
          name="notifications-outline"
          size={20}
          color={COLORS.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.notifTitle} numberOfLines={1}>
          {item.subject || "Notification"}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notifDate}>
          {new Date(item.createdAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const r = await client.get("/user/notifications");
      setNotifications(r.data.data?.notifications || []);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load notifications" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header
        title="Notifications"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, i) => item.id?.toString() || String(i)}
          renderItem={({ item }) => <NotifItem item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={{
            padding: 16,
            gap: 8,
            paddingBottom: insets.bottom + 24,
          }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons
                name="notifications-off-outline"
                size={56}
                color={COLORS.border}
              />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyDesc}>You're all caught up!</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  readAllBtn: {
    backgroundColor: COLORS.primary + "15",
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  readAllText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    ...SHADOW.sm,
    position: "relative",
  },
  unread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  dot: {
    position: "absolute",
    top: 14,
    left: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 3,
  },
  notifBody: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
    marginBottom: 4,
  },
  notifDate: { fontSize: 11, color: COLORS.subtle },
  empty: { alignItems: "center", padding: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.black },
  emptyDesc: { fontSize: 13, color: COLORS.muted },
});
