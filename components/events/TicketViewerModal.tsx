import React, { useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Linking } from "react-native";
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalCloseButton } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { EventSlot, Ticket } from "@/_sdk/models";
import QRCode from "react-native-qrcode-svg";

export interface TicketViewerModalProps {
  opened: boolean;
  onClose: () => void;
  tickets: Ticket[];
  event: any;
  eventSlot: EventSlot | null;
}

export default function TicketViewerModal({ opened, onClose, tickets, event, eventSlot }: TicketViewerModalProps) {
  const [index, setIndex] = useState(0);

  const hasPrev = index > 0;
  const hasNext = index < Math.max(0, tickets.length - 1);

  const current = tickets[index] || null;

  const getDateFromAny = (ts: any): Date | null => {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    if (typeof ts === "object" && "seconds" in ts) return new Date((ts as any).seconds * 1000);
    if (typeof ts === "string" || typeof ts === "number") return new Date(ts as any);
    return null;
  };

  const startDate = useMemo(() => getDateFromAny(eventSlot?.startTimeDate), [eventSlot?.startTimeDate]);
  const endDate = useMemo(() => getDateFromAny(eventSlot?.endTimeDate), [eventSlot?.endTimeDate]);

  const monthDay = (d: Date | null) => (d ? `${d.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "2-digit" })}` : "");
  const timeStr = (d: Date | null) => (d ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");

  return (
    <Modal isOpen={opened} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Text className="text-lg font-semibold">Your Tickets</Text>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          {tickets.length === 0 ? (
            <Text className="text-gray-700">No tickets yet.</Text>
          ) : (
            <ScrollView>
              {/* Event image */}
              {!!(event?.images && event.images[0]) && (
                <Image
                  source={{ uri: typeof event.images[0] === "string" ? event.images[0] : event.images[0]?.uri }}
                  className="w-full h-40 rounded-md mb-3"
                  resizeMode="cover"
                />
              )}

              {/* Title */}
              {!!eventSlot?.title && <Text className="text-base font-semibold mb-1">{eventSlot.title}</Text>}

              {/* Date/time */}
              <Text className="text-sm text-gray-700">
                {monthDay(startDate)}{startDate && endDate && monthDay(startDate) !== monthDay(endDate) ? ` - ${monthDay(endDate)}` : ""}
              </Text>
              <Text className="text-xs text-gray-600 mb-2">
                {timeStr(startDate)} - {timeStr(endDate)} {event?.timezone || ""}
              </Text>

              {/* Address link */}
              {!!eventSlot?.address && (
                <TouchableOpacity
                  onPress={() => {
                    const addr = (eventSlot.address as any)?.address || (eventSlot.address as any);
                    if (addr) {
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
                    }
                  }}
                >
                  <Text className="text-blue-600 underline mb-3" numberOfLines={2}>
                    {(eventSlot.address as any)?.address || (eventSlot.address as any)}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Pager controls */}
              <View className="flex-row justify-between items-center mb-2">
                <Button variant="outline" isDisabled={!hasPrev} onPress={() => setIndex((i) => Math.max(0, i - 1))}>
                  <Text>Previous</Text>
                </Button>
                <Text>
                  Ticket {index + 1} of {tickets.length}
                </Text>
                <Button variant="outline" isDisabled={!hasNext} onPress={() => setIndex((i) => Math.min(tickets.length - 1, i + 1))}>
                  <Text>Next</Text>
                </Button>
              </View>

              {/* Current ticket card */}
              {current && (
                <View className="items-center p-3 border border-gray-200 rounded-md bg-white">
                  <Text className="font-medium mb-2">Ticket ID: {current.id}</Text>
                  <View className="mb-2">
                    <QRCode value={String(current.id || "ticket")} size={160} backgroundColor="#ffffff" />
                  </View>
                  {!!current.ticketStatus && (
                    <Text className="text-xs text-gray-600">Status: {current.ticketStatus}</Text>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>
            <Text className="text-white">Close</Text>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}