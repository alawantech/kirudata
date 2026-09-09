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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import client from "../../api/client";
import { Badge } from "../../components/Card";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";

const FILTERS = [
  "All",
  "Data",
  "Airtime",
  "Airtime to Cash",
  "Cable",
  "Electricity",
  "Exam",
  "Wallet",
];

function fmt(n) {
  return (
    "₦" +
    Math.abs(Number(n)).toLocaleString("en-NG", { minimumFractionDigits: 2 })
  );
}
function statusColor(s) {
  if (s == null) return COLORS.subtle;
  if (s === 1) return COLORS.success;
  if (s === 2) return COLORS.warning;
  return COLORS.danger;
}
function statusLabel(s) {
  if (s === 1) return "Success";
  if (s === 2) return "Processing";
  if (s === 0) return "Failed";
  return String(s ?? "N/A");
}

function TxItem({ item, onPress }) {
  const color = statusColor(item.status);
  const icon =
    item.status === 1
      ? "checkmark-circle"
      : item.status === 2
        ? "time"
        : "close-circle";
  return (
    <TouchableOpacity style={styles.txRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.txIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txDesc} numberOfLines={1}>
          {item.servicedesc || item.servicename || "Transaction"}
        </Text>
        <Text style={styles.txDate}>
          {new Date(item.date).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={[styles.txAmount, { color: COLORS.text }]}>
          {fmt(item.amount)}
        </Text>
        <Badge label={statusLabel(item.status)} color={color} />
      </View>
    </TouchableOpacity>
  );
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [filter, setFilter] = useState("All");
  const [allTransactions, setAllTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const transactions =
    filter === "All"
      ? allTransactions
      : allTransactions.filter((tx) =>
          (tx.servicename || "").toLowerCase().includes(filter.toLowerCase()),
        );

  const fetchTx = async (pg = 1, reset = true) => {
    if (pg === 1) reset ? setLoading(true) : setRefreshing(true);
    else setLoadingMore(true);
    try {
      const params = { page: pg, limit: 20 };
      const r = await client.get("/user/transactions", { params });
      const data = r.data.data?.transactions || r.data.data || [];
      if (pg === 1) {
        setAllTx(data);
      } else {
        setAllTx((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
      setPage(pg);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load transactions" });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTx(1, true);
    }, []),
  );

  const onRefresh = () => fetchTx(1, false);
  const onEndReached = () => {
    if (!loadingMore && hasMore) fetchTx(page + 1, false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterWrap}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item)}
              style={[
                styles.filterChip,
                filter === item && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, i) => item.id?.toString() || String(i)}
          renderItem={({ item }) => (
            <TxItem
              item={item}
              onPress={() => navigation.navigate("Receipt", { ref: item.transref || item.ref })}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{
            padding: 16,
            gap: 8,
            paddingBottom: insets.bottom + 24,
          }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons
                name="receipt-outline"
                size={56}
                color={COLORS.border}
              />
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptyDesc}>
                Your transaction history will appear here
              </Text>
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ padding: 16 }}
              />
            ) : null
          }
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: COLORS.border,
                marginHorizontal: 4,
              }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  filterWrap: {
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 13, fontWeight: "600", color: COLORS.body },
  filterTextActive: { color: "#fff" },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: RADIUS.md,
    ...SHADOW.sm,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txDesc: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 2,
  },
  txDate: { fontSize: 11, color: COLORS.subtle },
  txAmount: { fontSize: 15, fontWeight: "900" },
  empty: { alignItems: "center", padding: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.black },
  emptyDesc: { fontSize: 13, color: COLORS.muted, textAlign: "center" },
});
