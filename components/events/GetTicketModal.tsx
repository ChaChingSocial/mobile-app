import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalCloseButton } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { EventSlot, Ticket, TicketOptions } from "@/_sdk/models";
import { eventApi } from "@/config/backend";
import { useSession } from "@/lib/providers/AuthContext";

export interface GetTicketModalProps {
  eventSlot: EventSlot | null;
  opened: boolean;
  onClose: () => void;
  ticketOptions?: TicketOptions[];
  onTicketIssued?: (tickets: Ticket[]) => void;
}

export default function GetTicketModal({ eventSlot, opened, onClose, ticketOptions, onTicketIssued }: GetTicketModalProps) {
  const { session } = useSession();
  const options: TicketOptions[] = useMemo(() => (ticketOptions ?? ((eventSlot as any)?.ticketOptions ?? [])) as TicketOptions[], [ticketOptions, eventSlot]);

  const [quantities, setQuantities] = useState<number[]>([]);
  const [customPrices, setCustomPrices] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setQuantities(options.map(() => 0));
    setCustomPrices(options.map(() => 0));
    setErrorMsg(null);
  }, [options, opened]);

  const inc = (idx: number) => setQuantities((prev) => prev.map((q, i) => (i === idx ? Math.min(10, (q || 0) + 1) : q)));
  const dec = (idx: number) => setQuantities((prev) => prev.map((q, i) => (i === idx ? Math.max(0, (q || 0) - 1) : q)));

  const onChangeCustom = (idx: number, val: string) => {
    const n = Number(val.replace(/[^0-9.]/g, "")) || 0;
    setCustomPrices((prev) => prev.map((p, i) => (i === idx ? n : p)));
  };

  const handleConfirm = async () => {
    setErrorMsg(null);
    if (!eventSlot?.id) {
      setErrorMsg("Missing event slot.");
      return;
    }
    const selected = options
      .map((opt, idx) => ({
        ...opt,
        quantity: quantities[idx] || 0,
        price: opt.price === 0 && opt.anyPrice ? (customPrices[idx] || 0) : (opt.price ?? 0),
      }))
      .filter((t) => (t.quantity || 0) > 0);

    if (selected.length === 0) return;

    const total = selected.reduce((sum, t) => sum + Number(t.price || 0) * (t.quantity || 0), 0);
    if (total > 0) {
      setErrorMsg("Paid checkout isn't available on mobile yet.");
      return;
    }

    // Free tickets flow
    setSubmitting(true);
    try {
      const created: Ticket[] = [];
      const endDate = (eventSlot as any)?.endTimeDate;
      const expiresAt = endDate
        ? (typeof endDate === "object" && "seconds" in endDate
            ? new Date((endDate.seconds as number) * 1000)
            : new Date(endDate))
        : undefined;

      for (const t of selected) {
        for (let i = 0; i < (t.quantity || 0); i += 1) {
          const ticket: Ticket = {
            eventSlotId: eventSlot.id,
            eventId: eventSlot.eventId,
            userId: session?.uid,
            username: session?.displayName || undefined,
            email: session?.email || undefined,
            profilePic: session?.profilePic || undefined,
            createdAt: new Date(),
            expiresAt,
            ticketStatus: "SOLD" as any,
            ticketOption: { amount: 0, currency: "USD" },
          };

          try {
            const res = await eventApi.createTicket({ ticket });
            let id: string | undefined;
            if (typeof res === "string") {
              try {
                const parsed = JSON.parse(res);
                const body = (parsed && (parsed.Body || parsed.body || parsed)) as any;
                id = body?.id ?? body?.Id ?? undefined;
              } catch {
                // ignore parse errors
              }
            } else if (res && typeof res === "object") {
              // @ts-ignore
              id = (res as any).id;
            }
            created.push({ ...ticket, id });
          } catch (e) {
            // swallow per-ticket errors to continue others
          }
        }
      }

      if (created.length > 0) {
        onTicketIssued?.(created);
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={opened} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Text className="text-lg font-semibold">Get Tickets</Text>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          {!eventSlot ? (
            <Text>Missing event slot.</Text>
          ) : options.length === 0 ? (
            <Text>No ticket options available.</Text>
          ) : (
            <View className="gap-3">
              {options.map((opt, idx) => (
                <View key={opt.id || idx} className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-medium" numberOfLines={1}>{opt.title || `Ticket ${idx + 1}`}</Text>
                    {opt.price === 0 && opt.anyPrice ? (
                      <View className="mt-1">
                        <Text className="text-xs text-gray-500">Enter amount</Text>
                        <TextInput
                          className="border border-gray-300 rounded px-2 py-1 mt-1 bg-white"
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          value={String(customPrices[idx] || 0)}
                          onChangeText={(v) => onChangeCustom(idx, v)}
                        />
                      </View>
                    ) : (
                      <Text className="text-gray-600 mt-1">${Number(opt.price || 0).toFixed(2)}</Text>
                    )}
                  </View>
                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => dec(idx)} className="px-3 py-1 border border-gray-300 rounded-l bg-white">
                      <Text>-</Text>
                    </TouchableOpacity>
                    <View className="px-3 py-1 border-t border-b border-gray-300 bg-white">
                      <Text>{quantities[idx] || 0}</Text>
                    </View>
                    <TouchableOpacity onPress={() => inc(idx)} className="px-3 py-1 border border-gray-300 rounded-r bg-white">
                      <Text>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {errorMsg ? <Text className="text-red-600 text-sm">{errorMsg}</Text> : null}
            </View>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose} variant="outline" className="mr-2">
            <Text>Close</Text>
          </Button>
          <Button onPress={handleConfirm} isDisabled={(quantities.every((q) => (q || 0) === 0)) || submitting} isLoading={submitting}>
            <Text className="text-white">Get Ticket(s)</Text>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}