/**
 * EarningsTab – shows a user's message-payment earnings.
 *
 * Displays:
 *  • Total USDC earned stat card
 *  • Period selector: 7 Days | 24 Hours | 60 Minutes
 *  • SVG bar chart bucketed by the selected period
 *  • Top payers list
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import {
  getMessageEarnings,
  type MessageEarning,
} from "@/lib/api/messages";
import { getUserProfile } from "@/lib/api/user";

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = "7D" | "24H" | "60M";

interface BucketedData {
  label: string;    // x-axis label
  value: number;    // USDC earned in this bucket
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function bucketEarnings(earnings: MessageEarning[], period: Period): BucketedData[] {
  const now = Date.now();

  if (period === "7D") {
    const buckets: BucketedData[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * 86_400_000);
      return { label: DAY_NAMES[d.getDay()], value: 0 };
    });

    for (const e of earnings) {
      if (!e.lastTopUpAt) continue;
      const ms = e.lastTopUpAt.toMillis();
      const daysAgo = Math.floor((now - ms) / 86_400_000);
      if (daysAgo >= 0 && daysAgo < 7) {
        buckets[6 - daysAgo].value += e.totalPaid;
      }
    }
    return buckets;
  }

  if (period === "24H") {
    const buckets: BucketedData[] = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now - (23 - i) * 3_600_000).getHours();
      const ampm = hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`;
      // Only label every 4 hours to avoid crowding
      return { label: i % 4 === 0 ? ampm : "", value: 0 };
    });

    for (const e of earnings) {
      if (!e.lastTopUpAt) continue;
      const ms = e.lastTopUpAt.toMillis();
      const hoursAgo = Math.floor((now - ms) / 3_600_000);
      if (hoursAgo >= 0 && hoursAgo < 24) {
        buckets[23 - hoursAgo].value += e.totalPaid;
      }
    }
    return buckets;
  }

  // 60M — minute buckets
  const buckets: BucketedData[] = Array.from({ length: 60 }, (_, i) => {
    const t = new Date(now - (59 - i) * 60_000);
    // Label every 10 minutes
    return {
      label: i % 10 === 0 ? `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}` : "",
      value: 0,
    };
  });

  for (const e of earnings) {
    if (!e.lastTopUpAt) continue;
    const ms = e.lastTopUpAt.toMillis();
    const minsAgo = Math.floor((now - ms) / 60_000);
    if (minsAgo >= 0 && minsAgo < 60) {
      buckets[59 - minsAgo].value += e.totalPaid;
    }
  }
  return buckets;
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

const CHART_HEIGHT = 160;
const PAD = { top: 16, right: 12, bottom: 30, left: 48 };
const BAR_COLOR = "#1e3a6e";
const BAR_EMPTY_COLOR = "#e5e7eb";
const GRID_COLOR = "#f3f4f6";
const AXIS_COLOR = "#e5e7eb";
const TEXT_COLOR = "#9ca3af";

function EarningsBarChart({ data }: { data: BucketedData[] }) {
  const screenW = Dimensions.get("window").width;
  const svgW = screenW - 32; // 16px side padding × 2
  const innerW = svgW - PAD.left - PAD.right;
  const innerH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 0.01);

  // 3 Y-axis tick lines
  const yTicks = [0, 0.5, 1].map((pct) => ({
    pct,
    y: PAD.top + innerH - pct * innerH,
    label: pct === 0 ? "0" : `$${(pct * maxValue).toFixed(2)}`,
  }));

  const slotW = innerW / data.length;
  const barW = Math.max(slotW * 0.55, 2);

  return (
    <Svg width={svgW} height={CHART_HEIGHT}>
      {/* Grid lines + Y labels */}
      {yTicks.map((tick, i) => (
        <G key={i}>
          <Line
            x1={PAD.left}
            y1={tick.y}
            x2={svgW - PAD.right}
            y2={tick.y}
            stroke={i === 0 ? AXIS_COLOR : GRID_COLOR}
            strokeWidth={1}
          />
          <SvgText
            x={PAD.left - 4}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={9}
            fill={TEXT_COLOR}
          >
            {tick.label}
          </SvgText>
        </G>
      ))}

      {/* Y axis line */}
      <Line
        x1={PAD.left}
        y1={PAD.top}
        x2={PAD.left}
        y2={PAD.top + innerH}
        stroke={AXIS_COLOR}
        strokeWidth={1}
      />

      {/* Bars + X labels */}
      {data.map((d, i) => {
        const barH = Math.max((d.value / maxValue) * innerH, d.value > 0 ? 3 : 0);
        const x = PAD.left + i * slotW + (slotW - barW) / 2;
        const y = PAD.top + innerH - barH;

        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH > 0 ? barH : 0}
              rx={2}
              fill={d.value > 0 ? BAR_COLOR : BAR_EMPTY_COLOR}
              opacity={d.value > 0 ? 1 : 0.3}
            />
            {d.label !== "" && (
              <SvgText
                x={x + barW / 2}
                y={PAD.top + innerH + 14}
                textAnchor="middle"
                fontSize={8}
                fill={TEXT_COLOR}
              >
                {d.label}
              </SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface EarningsTabProps {
  userId: string;
}

export default function EarningsTab({ userId }: EarningsTabProps) {
  const [earnings, setEarnings] = useState<MessageEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("7D");
  const [usernameMap, setUsernameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMessageEarnings(userId)
      .then(async (data) => {
        if (cancelled) return;
        setEarnings(data);

        // Fetch display names for every unique sender in parallel
        const uniqueSenderIds = [...new Set(data.map((e) => e.senderId))];
        const profiles = await Promise.all(
          uniqueSenderIds.map((id) =>
            getUserProfile(id).then((p) => ({
              id,
              name: (p as any)?.displayName as string | undefined,
            }))
          )
        );
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const { id, name } of profiles) {
          if (name) map[id] = name;
        }
        setUsernameMap(map);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const totalEarned = useMemo(
    () => earnings.reduce((sum, e) => sum + e.totalPaid, 0),
    [earnings]
  );

  const chartData = useMemo(
    () => bucketEarnings(earnings, period),
    [earnings, period]
  );

  // Top payers sorted by amount paid
  const topPayers = useMemo(
    () => [...earnings].sort((a, b) => b.totalPaid - a.totalPaid).slice(0, 5),
    [earnings]
  );

  const PERIODS: { key: Period; label: string }[] = [
    { key: "7D", label: "7 Days" },
    { key: "24H", label: "24 Hours" },
    { key: "60M", label: "60 Mins" },
  ];

  if (loading) {
    return (
      <View style={{ paddingVertical: 48, alignItems: "center" }}>
        <ActivityIndicator size="small" color="#1e3a6e" />
        <Text style={{ color: "#9ca3af", marginTop: 8, fontSize: 13 }}>
          Loading earnings…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: "#f9fafb" }}
      contentContainerStyle={{ paddingBottom: 32 }}
      scrollEnabled={false} // parent ScrollView handles scrolling
    >
      {/* ── Total Earned Card ── */}
      <View
        style={{
          margin: 16,
          borderRadius: 16,
          backgroundColor: "#1e3a6e",
          paddingVertical: 20,
          paddingHorizontal: 24,
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }}>
          Total Earned
        </Text>
        <Text style={{ color: "#ffffff", fontSize: 36, fontWeight: "800", marginTop: 4 }}>
          ${totalEarned.toFixed(2)}
          <Text style={{ fontSize: 16, fontWeight: "400", color: "rgba(255,255,255,0.7)" }}>
            {" "}USDC
          </Text>
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 }}>
          {earnings.length} {earnings.length === 1 ? "payer" : "payers"} · all time
        </Text>
      </View>

      {/* ── Earnings Over Time ── */}
      <View
        style={{
          marginHorizontal: 16,
          borderRadius: 16,
          backgroundColor: "#ffffff",
          padding: 16,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Header + period selector */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>
            Earnings by{" "}
            {period === "7D" ? "Day" : period === "24H" ? "Hour" : "Minute"}
          </Text>
          <View style={{ flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 8, padding: 2 }}>
            {PERIODS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setPeriod(key)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                  backgroundColor: period === key ? "#1e3a6e" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: period === key ? "#ffffff" : "#6b7280",
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bar chart */}
        {earnings.length === 0 ? (
          <View style={{ height: CHART_HEIGHT, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "#d1d5db", fontSize: 13 }}>No earnings yet</Text>
          </View>
        ) : (
          <EarningsBarChart data={chartData} />
        )}
      </View>

      {/* ── Top Payers ── */}
      {topPayers.length > 0 && (
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            borderRadius: 16,
            backgroundColor: "#ffffff",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            Top Payers
          </Text>

          {topPayers.map((e, i) => {
            const displayName =
              usernameMap[e.senderId] ||
              `${e.senderId.slice(0, 6)}…${e.senderId.slice(-4)}`;
            const lastDate = e.lastTopUpAt
              ? new Date(e.lastTopUpAt.toMillis()).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—";

            return (
              <View
                key={`${e.conversationId}-${e.senderId}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: "#f3f4f6",
                }}
              >
                {/* Rank badge */}
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: i === 0 ? "#fbbf24" : i === 1 ? "#d1d5db" : i === 2 ? "#c97d4e" : "#f3f4f6",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: i < 3 ? "#ffffff" : "#9ca3af" }}>
                    {i + 1}
                  </Text>
                </View>

                {/* Username */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151" }}>
                    {displayName}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                    Last paid {lastDate} · ${e.pricePerMsg.toFixed(2)}/msg
                  </Text>
                </View>

                {/* Amount */}
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#059669" }}>
                  ${e.totalPaid.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
