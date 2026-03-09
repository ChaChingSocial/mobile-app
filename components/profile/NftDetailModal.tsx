import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";

export type WalletNftPreview = {
  mint: string;
  name?: string;
  imageUri?: string;
  cluster?: "mainnet-beta" | "devnet";
};

type NftDetail = {
  description?: string;
  collection?: { name?: string; family?: string };
  attributes?: Array<{ trait_type: string; value: string | number }>;
};

export default function NftDetailModal({
  nft,
  visible,
  onClose,
}: {
  nft: WalletNftPreview | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<NftDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!nft || !visible) {
      setDetail(null);
      return;
    }
    // Magic Eden only indexes mainnet
    if (nft.cluster !== "mainnet-beta") return;

    setLoadingDetail(true);
    fetch(`https://api-mainnet.magiceden.dev/v2/tokens/${nft.mint}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setDetail(json);
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [nft?.mint, visible]);

  if (!nft) return null;

  const explorerUrl =
    nft.cluster === "devnet"
      ? `https://explorer.solana.com/address/${nft.mint}?cluster=devnet`
      : `https://explorer.solana.com/address/${nft.mint}`;

  const displayName = nft.name || `${nft.mint.slice(0, 8)}…`;
  const collectionName =
    (detail?.collection as any)?.name || (detail?.collection as any)?.family;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)" }}>
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: 56,
            right: 20,
            zIndex: 10,
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 20,
            padding: 8,
          }}
        >
          <Ionicons name="close" size={22} color="white" />
        </TouchableOpacity>

        {/* Full-width image */}
        <View style={{ width: "100%", aspectRatio: 1, backgroundColor: "#000" }}>
          {nft.imageUri ? (
            <Image
              source={{ uri: nft.imageUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          ) : (
            <View
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="image-outline" size={64} color="#4b5563" />
              <Text style={{ color: "#6b7280", marginTop: 8, fontSize: 13 }}>
                No image available
              </Text>
            </View>
          )}
        </View>

        {/* Metadata panel */}
        <ScrollView
          style={{ flex: 1, backgroundColor: "#111827" }}
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        >
          {/* Name */}
          <Text
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: "700",
              marginBottom: 4,
            }}
          >
            {displayName}
          </Text>

          {/* Collection name */}
          {collectionName ? (
            <Text
              style={{ color: "#a3e4d2", fontSize: 14, marginBottom: 14 }}
            >
              {collectionName}
            </Text>
          ) : null}

          {/* Cluster badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                backgroundColor:
                  nft.cluster === "mainnet-beta" ? "#1e3a6e" : "#7c3aed",
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{ color: "white", fontSize: 11, fontWeight: "600" }}
              >
                {nft.cluster === "mainnet-beta"
                  ? "Mainnet"
                  : nft.cluster === "devnet"
                  ? "Devnet"
                  : "Unknown"}
              </Text>
            </View>
          </View>

          {/* Mint address */}
          <View
            style={{
              backgroundColor: "#1f2937",
              borderRadius: 10,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <Text
              style={{ color: "#9ca3af", fontSize: 11, marginBottom: 6 }}
            >
              MINT ADDRESS
            </Text>
            <Text
              style={{ color: "#e5e7eb", fontSize: 12 }}
              selectable
            >
              {nft.mint}
            </Text>
          </View>

          {/* Description */}
          {detail?.description ? (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                DESCRIPTION
              </Text>
              <Text
                style={{ color: "#d1d5db", fontSize: 14, lineHeight: 21 }}
              >
                {detail.description}
              </Text>
            </View>
          ) : null}

          {/* Attributes */}
          {loadingDetail && (
            <ActivityIndicator
              color="#a3e4d2"
              style={{ marginVertical: 16 }}
            />
          )}
          {detail?.attributes && detail.attributes.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                ATTRIBUTES
              </Text>
              <View
                style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
              >
                {detail.attributes.map((attr, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: "#1f2937",
                      borderWidth: 1,
                      borderColor: "#374151",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      minWidth: "45%",
                    }}
                  >
                    <Text
                      style={{
                        color: "#a3e4d2",
                        fontSize: 10,
                        fontWeight: "600",
                        marginBottom: 3,
                        textTransform: "uppercase",
                        letterSpacing: 0.3,
                      }}
                    >
                      {attr.trait_type}
                    </Text>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 13,
                        fontWeight: "500",
                      }}
                    >
                      {String(attr.value)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* View on Explorer */}
          <TouchableOpacity
            onPress={() => Linking.openURL(explorerUrl)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#1e3a6e",
              borderRadius: 12,
              paddingVertical: 14,
              marginTop: 4,
            }}
          >
            <Ionicons name="open-outline" size={18} color="white" />
            <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
              View on Solana Explorer
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
