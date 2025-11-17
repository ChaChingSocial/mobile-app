import { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    Linking,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Timestamp } from "firebase/firestore";
import dayjs from "dayjs";
import { Post as PostType } from "@/types/post";
import {
    checkUserRSVP,
    updateEventRSVP,
    updatePostEvent,
} from "@/lib/api/newsfeed";
import { useSession } from "@/lib/providers/AuthContext";
import {
    Avatar,
    AvatarFallbackText,
    AvatarGroup,
    AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Checkbox,
    CheckboxIcon,
    CheckboxIndicator,
    CheckboxLabel,
} from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import SelectComponent from "@/components/common/SelectInput";
import { CheckIcon } from "@/components/ui/icon";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import TicketViewerModal from "@/components/events/TicketViewerModal";
import PostTags from "../post-editor/PostTag";
import {
    Modal,
    ModalBackdrop,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalCloseButton,
} from "@/components/ui/modal";
import type { Ticket, EventSlot } from "@/_sdk/models";
import GetTicketModal from "@/components/events/GetTicketModal";
import { eventApi } from "@/config/backend";

interface EventPostProps {
    post: PostType;
    editing: boolean;
    onEditingChange: (editing: boolean) => void;
}

export const EventPost = ({
                              post,
                              editing,
                              onEditingChange,
                          }: EventPostProps) => {
    const { session: currentUser } = useSession();
    const userId = currentUser?.uid;

    // ---------- Event V2 (mobile) ----------
    const eventV2: any = (post as any).eventV2 || (post as any).event || null;
    const eventSlots: EventSlot[] = (eventV2?.eventSlots || []) as EventSlot[];
    const hasImage = !!(eventV2?.images && eventV2.images.length > 0);

    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
        eventSlots.length > 0 ? 0 : null
    );
    const selectedSlot: EventSlot | null =
        selectedSlotIndex != null && eventSlots[selectedSlotIndex]
            ? eventSlots[selectedSlotIndex]
            : null;

    const [ticketModalOpened, setTicketModalOpened] = useState(false);
    const [ticketViewOpened, setTicketViewOpened] = useState(false);
    const [authPromptOpen, setAuthPromptOpen] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [allTickets, setAllTickets] = useState<Ticket[]>([]);
    const [hasValidTickets, setHasValidTickets] = useState(false);
    const [readMore, setReadMore] = useState(false);
    const [showReadMore, setShowReadMore] = useState(false);
    const descRef = useRef<Text>(null);
    const [eventTickets, setEventTickets] = useState<Ticket[]>([]);
    const [newlyPurchasedTickets, setNewlyPurchasedTickets] = useState<Ticket[]>([]);

    const descriptionHtml = (selectedSlot?.description as any) || eventV2?.description || "";

    useEffect(() => {
        // naive read-more toggle: if description string is long
        const plain = String(descriptionHtml || "").replace(/<[^>]+>/g, "");
        setShowReadMore(plain.length > 220);
    }, [descriptionHtml]);

    // tickets for selected slot
    useEffect(() => {
        const api = eventApi;
        async function fetchTickets() {
            try {
                if (selectedSlot?.id) {
                    const t = await api.getEventSlotTickets({ eventSlotId: selectedSlot.id });
                    setAllTickets(t || []);
                } else {
                    setAllTickets([]);
                }
            } catch (e) {
                setAllTickets([]);
            }
        }
        fetchTickets();
    }, [selectedSlot?.id]);

    useEffect(() => {
        const api = eventApi;
        async function fetchUserTickets() {
            if (!selectedSlot?.id || !userId) {
                setTickets([]);
                setHasValidTickets(false);
                return;
            }
            try {
                const t = await api.getUserEventSlotTickets({
                    eventSlotId: selectedSlot.id,
                    userId,
                });
                const valid = (t || []).filter((tk) => tk.id && tk.id.trim() !== "");
                setTickets(valid);
                setEventTickets(valid);
                setHasValidTickets(valid.length > 0);
            } catch (e) {
                setTickets([]);
                setHasValidTickets(false);
            }
        }
        fetchUserTickets();
    }, [selectedSlot?.id, userId]);

    const getDateFromAny = (ts: any): Date => {
        if (!ts) return new Date();
        if (ts instanceof Date) return ts;
        if (typeof ts === "object" && "seconds" in ts) return new Date((ts as any).seconds * 1000);
        if (typeof ts === "string" || typeof ts === "number") return new Date(ts as any);
        return new Date();
    };

    const startDate = selectedSlot?.startTimeDate
        ? getDateFromAny(selectedSlot.startTimeDate)
        : eventV2?.startTimeDate
            ? getDateFromAny(eventV2.startTimeDate)
            : new Date();
    const endDate = selectedSlot?.endTimeDate
        ? getDateFromAny(selectedSlot.endTimeDate)
        : eventV2?.endTimeDate
            ? getDateFromAny(eventV2.endTimeDate)
            : new Date();

    const month = dayjs(startDate).isValid() ? dayjs(startDate).format("MMM") : "";
    const day = dayjs(startDate).isValid() ? dayjs(startDate).format("DD") : "";
    const displayStartTime = dayjs(startDate).isValid() ? dayjs(startDate).format("h:mm A") : "";
    const displayEndTime = dayjs(endDate).isValid() ? dayjs(endDate).format("h:mm A") : "";
    const calendarStartDate = dayjs(startDate).isValid()
        ? dayjs(startDate).format("ddd, MM-DD-YY")
        : "";
    const calendarEndDate = dayjs(endDate).isValid() ? dayjs(endDate).format("ddd, MM-DD-YY") : "";

    const handleSelectSlot = (idx: number) => {
        setSelectedSlotIndex(idx);
    };

    const handleGetTickets = () => {
        if (!currentUser) {
            setAuthPromptOpen(true);
            return;
        }
        setTicketModalOpened(true);
    };

    const handleViewTicket = () => setTicketViewOpened(true);

    // ---------- Legacy edit (kept) ----------
    const userData = {
        localId: userId,
        email: currentUser?.email,
        displayName: currentUser?.displayName,
        photoUrl: currentUser?.profilePic,
    };

    const firebaseStartTimeDate = useMemo(() => {
        return (post as any).event?.startTimeDate
            ? new Timestamp(
                (post as any).event.startTimeDate.seconds,
                (post as any).event.startTimeDate.nanoseconds
            )
            : null;
    }, [(post as any).event?.startTimeDate]);

    const firebaseEndTimeDate = useMemo(() => {
        return (post as any).event?.endTimeDate
            ? new Timestamp(
                (post as any).event.endTimeDate.seconds,
                (post as any).event.endTimeDate.nanoseconds
            )
            : null;
    }, [(post as any).event?.endTimeDate]);

    const [editedStartTimeDate, setEditedStartTimeDate] = useState(
        firebaseStartTimeDate ? new Date(firebaseStartTimeDate.seconds * 1000) : new Date()
    );
    const [editedEndTimeDate, setEditedEndTimeDate] = useState(
        firebaseEndTimeDate ? new Date(firebaseEndTimeDate.seconds * 1000) : new Date()
    );
    const [editedTitle, setEditedTitle] = useState((post as any).event?.title || "");
    const [editedDescription, setEditedDescription] = useState(
        (post as any).event?.description || ""
    );
    const [editedTimezone, setEditedTimezone] = useState(
        (post as any).event?.timezone || "UTC"
    );
    const [editedPrice, setEditedPrice] = useState((post as any).event?.price || 0);
    const [editedPrivacy, setEditedPrivacy] = useState(
        (post as any).event?.privacy || "PUBLIC"
    );
    const [editedEventType, setEditedEventType] = useState(
        (post as any).event?.eventType || "LIVE_STREAM"
    );
    const [editedRecorded, setEditedRecorded] = useState<boolean>(
        (post as any).event?.recorded || false
    );
    const [editedCommentsEnabled, setEditedCommentsEnabled] = useState<boolean>(
        (post as any).event?.commentsEnabled || true
    );
    const [editedLinks, setEditedLinks] = useState({
        link1: (post as any).event?.link1 || "",
        link2: (post as any).event?.link2 || "",
        link3: (post as any).event?.link3 || "",
    });
    const [editedLumaWidget, setEditedLumaWidget] = useState(
        (post as any).event?.lumaWidget || ""
    );
    const [rsvpStatus, setRsvpStatus] = useState(false);

    useEffect(() => {
        if ((post as any).event?.startTimeDate) {
            setEditedStartTimeDate(new Date((post as any).event.startTimeDate.seconds * 1000));
        }
        if ((post as any).event?.endTimeDate) {
            setEditedEndTimeDate(new Date((post as any).event.endTimeDate.seconds * 1000));
        }
    }, [(post as any).event?.startTimeDate, (post as any).event?.endTimeDate]);

    useEffect(() => {
        if (userId && post.id) {
            checkUserRSVP(post.id, userId).then((rsvp) => setRsvpStatus(rsvp));
        }
    }, [userId, post.id]);

    const formattedStartDate = dayjs(editedStartTimeDate).isValid()
        ? dayjs(editedStartTimeDate).format("YYYY-MM-DD")
        : "Invalid Date";
    const formattedEndDate = dayjs(editedEndTimeDate).isValid()
        ? dayjs(editedEndTimeDate).format("YYYY-MM-DD")
        : "Invalid Date";
    const formattedStartTime = dayjs(editedStartTimeDate).isValid()
        ? dayjs(editedStartTimeDate).format("HH:mm")
        : "Invalid Time";
    const formattedEndTime = dayjs(editedEndTimeDate).isValid()
        ? dayjs(editedEndTimeDate).format("HH:mm")
        : "Invalid Time";

    const handleSave = () => {
        if (post.id) {
            updatePostEvent({
                postId: post.id,
                editedTitle,
                editedDescription,
                editedStartTimeDate,
                editedEndTimeDate,
                editedTimezone,
                editedPrice,
                editedPrivacy,
                editedEventType,
                editedRecorded,
                editedCommentsEnabled,
                editedLinks,
                editedLumaWidget,
            }).then(() => onEditingChange(false));
        }
    };

    const handleCancel = () => onEditingChange(false);

    const handleRsvpToggle = async () => {
        setRsvpStatus((prev) => !prev);
        if (post?.id && userData.localId) {
            await updateEventRSVP(
                post.id,
                userData as {
                    localId: string;
                    email: string;
                    displayName: string;
                    photoUrl: string;
                }
            );
        }
    };

    const handleLinkPress = (url: string) => Linking.openURL(url);

    if (editing) {
        return (
            <ScrollView className="p-2">{/* keep legacy editor */}
                <TextInput
                    className="border border-gray-300 rounded p-3 mb-4 bg-white"
                    placeholder="Title"
                    value={editedTitle}
                    onChangeText={setEditedTitle}
                />
                <TextInput
                    className="border border-gray-300 rounded p-3 mb-4 bg-white min-h-[100px] text-top"
                    placeholder="Description"
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    multiline
                />
                <TextInput
                    className="border border-gray-300 rounded p-3 mb-4 bg-white"
                    placeholder="Timezone"
                    value={editedTimezone}
                    onChangeText={setEditedTimezone}
                />
                <TextInput
                    className="border border-gray-300 rounded p-3 mb-4 bg-white"
                    placeholder="Price"
                    value={String(editedPrice)}
                    onChangeText={(val) => setEditedPrice(Number(val) || 0)}
                    keyboardType="numeric"
                />
                <TextInput
                    className="border border-gray-300 rounded p-3 mb-4 bg-white min-h-[100px] text-top"
                    placeholder="Embed Luma Event Page"
                    value={editedLumaWidget}
                    onChangeText={setEditedLumaWidget}
                    multiline
                />
                <TextInput
                    className="border border-gray-300 rounded p-3 mb-4 bg-white"
                    placeholder="Link 1"
                    value={editedLinks.link1}
                    onChangeText={(val) => setEditedLinks((prev) => ({ ...prev, link1: val }))}
                />
                <TextInput
                    className="border border-gray-300 rounded p-3 mb-4 bg-white"
                    placeholder="Link 2"
                    value={editedLinks.link2}
                    onChangeText={(val) => setEditedLinks((prev) => ({ ...prev, link2: val }))}
                />
                <TextInput
                    className="border border-gray-300 rounded p-3 mb-4 bg-white"
                    placeholder="Link 3"
                    value={editedLinks.link3}
                    onChangeText={(val) => setEditedLinks((prev) => ({ ...prev, link3: val }))}
                />
                <SelectComponent
                    options={[
                        { label: "Public", value: "PUBLIC" },
                        { label: "Invite Only", value: "INVITE_ONLY" },
                        { label: "Paid Members", value: "PAID_MEMBERS" },
                    ]}
                    value={editedPrivacy}
                    onValueChange={setEditedPrivacy}
                    placeholder="Privacy"
                    triggerClassName="w-full border-gray-300"
                    contentClassName="bg-white"
                    inputClassName="text-sm"
                    iconClassName="mr-3"
                />
                <SelectComponent
                    options={[
                        { label: "Live Stream", value: "LIVE_STREAM" },
                        { label: "Webinar", value: "PRE_RECORDED" },
                        { label: "Normal Event", value: "NORMAL_EVENT" },
                    ]}
                    value={editedEventType}
                    onValueChange={setEditedEventType}
                    placeholder="Event Type"
                    triggerClassName="w-full border-gray-300"
                    contentClassName="bg-white"
                    inputClassName="text-sm"
                    iconClassName="mr-3"
                />
                {editedEventType === "LIVE_STREAM" && (
                    <View className="mb-4">
                        <Checkbox
                            size="md"
                            isInvalid={false}
                            isDisabled={false}
                            value={String(editedRecorded)}
                            onChange={() => setEditedRecorded(!editedRecorded)}
                        >
                            <CheckboxIndicator>
                                <CheckboxIcon as={CheckIcon} />
                            </CheckboxIndicator>
                            <CheckboxLabel>Record this event</CheckboxLabel>
                        </Checkbox>
                        <Checkbox
                            size="md"
                            isInvalid={false}
                            isDisabled={false}
                            value={String(editedCommentsEnabled)}
                            onChange={() => setEditedCommentsEnabled(!editedCommentsEnabled)}
                        >
                            <CheckboxIndicator>
                                <CheckboxIcon as={CheckIcon} />
                            </CheckboxIndicator>
                            <CheckboxLabel>Enable Comments</CheckboxLabel>
                        </Checkbox>
                    </View>
                )}
                <View className="flex-row gap-4 mt-4">
                    <Button onPress={handleSave} className="flex-1">
                        <Text className="text-white font-medium">Save</Text>
                    </Button>
                    <Button onPress={handleCancel} variant="outline" className="flex-1 bg-transparent border border-gray-300">
                        <Text className="font-medium">Cancel</Text>
                    </Button>
                </View>
            </ScrollView>
        );
    }

    // ---------- Render Event V2 look ----------
    return (
      <View className="p-2 my-2">
        {!!eventV2?.title && (
          <Text className="text-2xl font-semibold text-gray-800 mb-2">
            {eventV2.title}
          </Text>
        )}

        {eventSlots.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
          >
            {eventSlots.map((slot, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSelectSlot(idx)}
                className={`mr-3 p-3 rounded-lg border ${
                  selectedSlotIndex === idx
                    ? "border-violet-500"
                    : "border-gray-200"
                } bg-white`}
                activeOpacity={0.8}
              >
                <Text className="text-xs text-gray-500">
                  {dayjs(getDateFromAny(slot.startTimeDate)).format("MMM DD")}
                </Text>
                <Text className="font-semibold" numberOfLines={1}>
                  {slot.title || "Event Slot"}
                </Text>
                <Text className="text-xs text-gray-600" numberOfLines={1}>
                  {dayjs(getDateFromAny(slot.startTimeDate)).format("h:mm A")} -{" "}
                  {dayjs(getDateFromAny(slot.endTimeDate)).format("h:mm A")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View className="w-full flex-col gap-3">
          {(() => {
            const img0: any = eventV2?.images?.[0];
            const uri =
              typeof img0 === "string" ? img0 : img0?.uri ?? img0?.url ?? "";
            return uri ? (
              <Image
                source={{ uri }}
                className="w-full h-48 rounded-lg"
                resizeMode="cover"
              />
            ) : null;
          })()}

          {!!selectedSlot && (
            <View className="flex-row items-stretch border border-gray-300 rounded-lg bg-gray-100 w-full overflow-hidden min-h-[60px]">
              <View className="items-center justify-center bg-gray-800 w-16 rounded-l-lg">
                <Text className="text-[10px] text-gray-300 uppercase">
                  {month}
                </Text>
                <Text className="text-lg text-white font-semibold">{day}</Text>
              </View>
              <View className="flex-1 justify-center px-3 py-2">
                <Text className="text-sm text-black">
                  {calendarStartDate === calendarEndDate
                    ? calendarStartDate
                    : `${calendarStartDate} - ${calendarEndDate}`}
                </Text>
                <Text className="text-xs text-gray-600">
                  {displayStartTime} - {displayEndTime}{" "}
                  {eventV2?.timezone || ""}
                </Text>
              </View>
            </View>
          )}

          {/* meeting link */}
          {(selectedSlot as any)?.meetingLink || eventV2?.meetingLink ? (
            <TouchableOpacity
              className="flex-row items-center border border-gray-300 rounded-lg bg-gray-100 min-h-[60px]"
              onPress={() => {
                const url =
                  (selectedSlot as any)?.meetingLink || eventV2?.meetingLink;
                if (url) Linking.openURL(url);
              }}
              activeOpacity={0.8}
            >
              <View className="items-center justify-center bg-gray-800 w-16 rounded-l-lg min-h-[60px]">
                <FontAwesome5 name="link" size={20} color="#fff" />
              </View>
              <Text
                className="flex-1 text-blue-600 underline px-2"
                numberOfLines={1}
              >
                {(selectedSlot as any)?.meetingLink || eventV2?.meetingLink}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* address */}
          {!!selectedSlot?.address && (
            <TouchableOpacity
              className="flex-row items-center border border-gray-300 rounded-lg bg-gray-100 min-h-[60px]"
              onPress={() => {
                const addr =
                  (selectedSlot?.address as any)?.address ||
                  (selectedSlot?.address as any) ||
                  "";
                if (addr) {
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      addr
                    )}`
                  );
                }
              }}
              activeOpacity={0.8}
            >
              <View className="items-center justify-center bg-gray-800 w-16 rounded-l-lg min-h-[60px]">
                <FontAwesome5 name="map-pin" size={18} color="#fff" />
              </View>
              <Text
                className="flex-1 text-blue-600 underline px-2"
                numberOfLines={2}
              >
                {(selectedSlot?.address as any)?.address ||
                  (selectedSlot?.address as any)}
              </Text>
            </TouchableOpacity>
          )}

          {/* action buttons */}
          <View className="flex-row flex-wrap gap-3 mt-2">
            <Button onPress={handleGetTickets} className="px-4 py-1">
              <Text className="text-white font-medium">Get Ticket</Text>
            </Button>
            {(post as any).event?.moderators?.includes(userId || "") && (
              <Button variant="solid" className="px-4 py-3 bg-gray-800">
                <Text className="text-white font-medium">Scan Tickets</Text>
              </Button>
            )}
            {hasValidTickets && (
              <Button
                variant="solid"
                className="px-4 py-3 bg-gray-700"
                onPress={handleViewTicket}
              >
                <Text className="text-white font-medium">View Ticket</Text>
              </Button>
            )}
          </View>

          {/* description */}
          {!!descriptionHtml && (
            <View className="bg-white rounded-md p-2">
              <View>
                {!readMore ? (
                  <Text numberOfLines={6} className="text-gray-700">
                    {/* Render stripped HTML preview */}
                    {String(descriptionHtml).replace(/<[^>]+>/g, "")}
                  </Text>
                ) : (
                  <HtmlRenderText source={String(descriptionHtml)} />
                )}
              </View>
              {showReadMore && (
                <TouchableOpacity onPress={() => setReadMore((p) => !p)}>
                  <Text className="text-blue-600 underline mt-2">
                    {readMore ? "Read Less" : "Read more"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* links */}
          {Array.isArray(eventV2?.links) && eventV2.links.length > 0 && (
            <View className="mt-2">
              {eventV2.links.map((ln: string, i: number) => (
                <TouchableOpacity
                  key={i}
                  className="flex-row items-center mb-2"
                  onPress={() => Linking.openURL(ln)}
                >
                  <FontAwesome5 name="link" size={16} color="#3b82f6" />
                  <Text
                    className="text-sm text-blue-600 underline ml-2"
                    numberOfLines={1}
                  >
                    {ln}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* sponsors */}
          {Array.isArray(eventV2?.sponsors) && eventV2.sponsors.length > 0 && (
            <View className="mt-4">
              <Text className="text-base font-semibold text-gray-800 mb-2">
                Event Sponsors & Partners
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {eventV2.sponsors.map((sp: any, idx: number) => {
                  const hasUrl = !!sp?.link;
                  const CardComponent = hasUrl ? TouchableOpacity : View;
                  return (
                    <CardComponent
                      key={idx}
                      className="w-[48%] bg-white rounded-md border border-gray-200 p-3"
                      {...(hasUrl && {
                        onPress: () => Linking.openURL(sp.link),
                      })}
                      activeOpacity={hasUrl ? 0.8 : 1}
                    >
                      {!!sp?.image && (
                        <Image
                          source={{
                            uri:
                              typeof sp.image === "string"
                                ? sp.image
                                : sp.image?.uri,
                          }}
                          className="w-full h-16 rounded"
                          resizeMode="contain"
                        />
                      )}
                      {!!sp?.title && (
                        <Text className="text-center font-semibold text-xs mt-2">
                          {sp.title}
                        </Text>
                      )}
                      {!!sp?.description && (
                        <Text
                          className="text-center text-[11px] text-gray-600 mt-1"
                          numberOfLines={3}
                        >
                          {sp.description}
                        </Text>
                      )}
                    </CardComponent>
                  );
                })}
              </View>
            </View>
          )}

          {/* hosts */}
          {Array.isArray(selectedSlot?.hosts) &&
            selectedSlot!.hosts!.length > 0 && (
              <View className="px-1 mt-3">
                <View className="flex-row items-center gap-2">
                  <Text className="font-bold text-base mr-2">Hosts:</Text>
                  <AvatarGroup>
                    {selectedSlot!
                      .hosts!.slice(0, 4)
                      .map((h: any, idx: number) => (
                        <Avatar size="sm" key={idx}>
                          <AvatarFallbackText>
                            {h?.username || "Host"}
                          </AvatarFallbackText>
                          {h?.profilePic ? (
                            <AvatarImage source={{ uri: h.profilePic }} />
                          ) : null}
                        </Avatar>
                      ))}
                    {selectedSlot!.hosts!.length > 4 && (
                      <Avatar size="sm">
                        <AvatarFallbackText>{`+${
                          selectedSlot!.hosts!.length - 4
                        }`}</AvatarFallbackText>
                      </Avatar>
                    )}
                  </AvatarGroup>
                </View>
              </View>
            )}

          {/* attendees */}
          {allTickets.length > 0 && (
            <View className="px-1 mt-3">
              <View className="flex-row items-center gap-2">
                <Text className="font-bold text-base mr-2">Attendees:</Text>
                <AvatarGroup>
                  {allTickets.slice(0, 6).map((t, idx) => (
                    <Avatar size="sm" key={idx}>
                      <AvatarFallbackText>
                        {t.username || t.email || "Attendee"}
                      </AvatarFallbackText>
                      {t.profilePic ? (
                        <AvatarImage source={{ uri: t.profilePic }} />
                      ) : null}
                    </Avatar>
                  ))}
                  {allTickets.length > 6 && (
                    <Avatar size="sm">
                      <AvatarFallbackText>{`+${
                        allTickets.length - 6
                      }`}</AvatarFallbackText>
                    </Avatar>
                  )}
                </AvatarGroup>
              </View>
            </View>
          )}

          {/* tags */}
          {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}

          {/* going badge */}
          {hasValidTickets && (
            <View className="absolute right-4 top-4">
              <Badge variant="solid" action="success">
                <Text className="text-white">You're Going</Text>
              </Badge>
            </View>
          )}
        </View>

        {/* Get Ticket Modal */}
        {selectedSlot && (
          <GetTicketModal
            eventSlot={selectedSlot}
            opened={ticketModalOpened}
            onClose={() => setTicketModalOpened(false)}
            onTicketIssued={async (newTickets) => {
              // Optimistic update first
              if (newTickets.length > 0) {
                setNewlyPurchasedTickets(newTickets);
                setHasValidTickets(true);
                setTicketViewOpened(true);
              }

              // Then refetch in the background to sync with server
              const api = eventApi;
              try {
                const t = await api.getUserEventSlotTickets({
                  eventSlotId: selectedSlot.id,
                  userId: userId!,
                });
                const valid = (t || []).filter(
                  (tk) => tk.id && tk.id.trim() !== ""
                );
                setTickets(valid);
                setHasValidTickets(valid.length > 0);
              } catch (e) {
                // error with refetch is ok, we did an optimistic update
                console.log(
                  "Failed to refetch tickets after issuing, using optimistic update.",
                  e
                );
              }
            }}
          />
        )}

        {hasValidTickets && selectedSlot && post.eventV2 && (
          <TicketViewerModal
            opened={ticketViewOpened}
            onClose={() => {
              setTicketViewOpened(false);
              setNewlyPurchasedTickets([]);
              // Refetch tickets when modal is closed
              const api = eventApi;
              api
                .getUserEventSlotTickets({
                  eventSlotId: selectedSlot.id,
                  userId: userId!,
                })
                .then((t) => {
                  const valid = (t || []).filter(
                    (tk) => tk.id && tk.id.trim() !== ""
                  );
                  setTickets(valid);
                  setHasValidTickets(valid.length > 0);
                });
            }}
            event={post.eventV2}
            eventSlot={selectedSlot}
            tickets={
              newlyPurchasedTickets.length > 0
                ? newlyPurchasedTickets
                : tickets.filter(
                    (ticket) =>
                      ticket.eventSlotId === selectedSlot.id && ticket.id
                  )
            }
          />
        )}
        {/*/!* Ticket Viewer Modal *!/*/}
        {/*<Modal isOpen={ticketViewOpened} onClose={() => setTicketViewOpened(false)}>*/}
        {/*    <ModalBackdrop />*/}
        {/*    <ModalContent>*/}
        {/*        <ModalHeader>*/}
        {/*            <Text className="text-lg font-semibold">Your Tickets</Text>*/}
        {/*            <ModalCloseButton />*/}
        {/*        </ModalHeader>*/}
        {/*        <ModalBody>*/}
        {/*            {tickets.length === 0 ? (*/}
        {/*                <Text className="text-gray-600">No tickets yet.</Text>*/}
        {/*            ) : (*/}
        {/*                tickets.map((t, key) => (*/}
        {/*                    <View key={key} className="mb-3 p-3 border border-gray-200 rounded-md bg-white">*/}
        {/*                        <Text className="font-semibold">Ticket ID: {t.id}</Text>*/}
        {/*                        {!!t.ticketStatus && (*/}
        {/*                            <Text className="text-xs text-gray-600">Status: {t.ticketStatus}</Text>*/}
        {/*                        )}*/}
        {/*                    </View>*/}
        {/*                ))*/}
        {/*            )}*/}
        {/*        </ModalBody>*/}
        {/*        <ModalFooter>*/}
        {/*            <Button onPress={() => setTicketViewOpened(false)}>*/}
        {/*                <Text className="text-white">Close</Text>*/}
        {/*            </Button>*/}
        {/*        </ModalFooter>*/}
        {/*    </ModalContent>*/}
        {/*</Modal>*/}

        {/* Auth prompt */}
        <Modal isOpen={authPromptOpen} onClose={() => setAuthPromptOpen(false)}>
          <ModalBackdrop />
          <ModalContent>
            <ModalHeader>
              <Text className="text-lg font-semibold">Sign in required</Text>
              <ModalCloseButton />
            </ModalHeader>
            <ModalBody>
              <Text className="text-gray-700">
                Please log in to get tickets.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button
                onPress={() => setAuthPromptOpen(false)}
                variant="outline"
              >
                <Text>Close</Text>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </View>
    );
};
