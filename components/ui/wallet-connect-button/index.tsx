import { Ionicons } from "@expo/vector-icons";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

const SECURE_STORE_KEY = "solana_wallet_auth_token";

const APP_IDENTITY = {
  name: "ChaChingSocial",
  uri: "https://chachingsocial.com",
  icon: "favicon.ico",
};

export default function WalletConnectButton() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Silently re-authorize on mount if a stored token exists
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const savedToken = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!savedToken || cancelled) return;
      try {
        await transact(async (wallet) => {
          const result = await wallet.reauthorize({
            auth_token: savedToken,
            identity: APP_IDENTITY,
          });
          if (!cancelled) {
            setPublicKey(result.accounts[0].address);
            await SecureStore.setItemAsync(SECURE_STORE_KEY, result.auth_token);
          }
        });
      } catch {
        // Token expired — clear it so user can reconnect manually
        await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      await transact(async (wallet) => {
        const result = await wallet.authorize({
          chain: "solana:mainnet",
          identity: APP_IDENTITY,
        });
        setPublicKey(result.accounts[0].address);
        await SecureStore.setItemAsync(SECURE_STORE_KEY, result.auth_token);
      });
    } catch (e: any) {
      const msg: string = e?.message ?? String(e);
      Alert.alert(
        "Connection Failed",
        msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("no wallet")
          ? "No MWA-compatible wallet found. Please install Phantom, Solflare, or Backpack."
          : msg
      );
    } finally {
      setConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
    setPublicKey(null);
  }, []);

  if (publicKey) {
    const shortAddress = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
    return (
      <TouchableOpacity
        onPress={handleDisconnect}
        className="bg-[#1e3a6e] rounded-full px-4 py-3 flex-row items-center gap-2"
      >
        <View className="bg-green-400 rounded-full w-2 h-2" />
        <Text className="text-white font-semibold">{shortAddress}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleConnect}
      disabled={connecting}
      className="bg-[#1e3a6e] rounded-full px-4 py-3 flex-row items-center gap-2"
    >
      <Ionicons name="wallet-outline" size={18} color="white" />
      <Text className="text-white font-semibold">
        {connecting ? "Connecting..." : "Connect Wallet"}
      </Text>
    </TouchableOpacity>
  );
}
