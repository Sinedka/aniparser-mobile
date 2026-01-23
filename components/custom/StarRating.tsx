import { ThemedView } from "../themed-view";
import React from "react";
import { StyleSheet } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { ThemedText } from "../themed-text";

type StarRatingProps = {
  rating: number;
  users: number;
};

export default function StarRating({ rating, users }: StarRatingProps) {
  return (
    <ThemedView style={styles.container}>
      {/* Rating */}
      <ThemedView style={styles.item}>
        <Ionicons name="star" size={18} color="#FF9F0A" />
        <ThemedText style={styles.ratingText}>{rating.toFixed(2)}</ThemedText>
      </ThemedView>

      {/* Users */}
      <ThemedView style={styles.item}>
        <Ionicons name="person" size={18} color="#9E9E9E" />
        <ThemedText style={styles.usersText}>{formatUsers(users)}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function formatUsers(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toString();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: '100%',
    backgroundColor: 'black',
    gap: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    color: "#FF9F0A",
    fontSize: 16,
    fontWeight: "600",
  },
  usersText: {
    color: "#9E9E9E",
    fontSize: 16,
    fontWeight: "500",
  },
});
