import React from "react";
import {
  ActivityIndicator,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSend: (amountSol: number, description: string, useDevnet: boolean) => Promise<void>;
};

export default function PaymentRequestSheet({ visible, onClose, onSend }: Props) {
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [useDevnet, setUseDevnet] = React.useState(true);
  const [sending, setSending] = React.useState(false);

  const handleSend = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !description.trim()) return;
    setSending(true);
    try {
      await onSend(parsed, description.trim(), useDevnet);
      setAmount("");
      setDescription("");
      onClose();
    } catch (e) {
      console.error("Payment request error", e);
    } finally {
      setSending(false);
    }
  };

  if (!visible) return null;
  return (
    <RNModal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
          />

          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%" }}>
            <View
              style={{
                width: "100%",
                backgroundColor: "white",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                overflow: "hidden",
                maxHeight: "88%",
              }}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}
              >
                <View style={{ width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1f2937", marginBottom: 4 }}>Request Payment</Text>
                <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
                  Anyone in this chat can pay. Their avatar will appear on the message.
                </Text>

                {/* Amount */}
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 }}>Amount (USDC)</Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, color: "#9ca3af", marginRight: 4 }}>$</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#9ca3af"
                    style={{ flex: 1, fontSize: 20, fontWeight: "600", color: "#1f2937", paddingVertical: 14 }}
                  />
                  <Text style={{ fontSize: 14, color: "#6b7280" }}>USDC</Text>
                </View>

                {/* Description */}
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 }}>What's it for?</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g. Dinner split, event tickets…"
                  placeholderTextColor="#9ca3af"
                  maxLength={80}
                  style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: "#1f2937", marginBottom: 16 }}
                />

                {/* Network toggle */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151" }}>Use Devnet</Text>
                    <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                      {useDevnet ? "Devnet USDC (testing)" : "Mainnet USDC (real)"}
                    </Text>
                  </View>
                  <Switch
                    value={useDevnet}
                    onValueChange={setUseDevnet}
                    trackColor={{ false: "#e5e7eb", true: "#93c5fd" }}
                    thumbColor={useDevnet ? "#1e3a6e" : "#9ca3af"}
                  />
                </View>
              </ScrollView>

              <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 26 : 14 }}>
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={sending || !amount || !description.trim()}
                  style={{
                    backgroundColor: sending || !amount || !description.trim() ? "#93c5fd" : "#1e3a6e",
                    borderRadius: 14,
                    paddingVertical: 15,
                    alignItems: "center",
                  }}
                >
                  {sending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                      Send Request
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
