/**
 * LinkTree — React Native component ported from the Next.js web version.
 * Shows a user's saved links grouped by category, with social icons at the top.
 * Own-profile users can add / edit / delete links.
 */
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addUserLink,
  deleteUserLink,
  getUserLinks,
  updateUserLink,
  UserLink,
} from "@/lib/api/userLinks";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Social", "Art", "Tech", "Business", "Marketing", "Presentation",
  "Deals", "Donations", "Writing", "Music", "Videos", "Podcasts",
  "Events", "Community", "Accomplishments", "Store", "Projects",
  "Research", "Education", "Travel", "Food", "Other",
];

const CATEGORY_EMOJI: Record<string, string> = {
  Social: "🔗", Art: "🎨", Tech: "💻", Business: "💼",
  Marketing: "📣", Presentation: "🧾", Deals: "🛍️",
  Donations: "🤝", Writing: "✍️", Music: "🎵",
  Videos: "🎬", Podcasts: "🎙️", Events: "📅",
  Community: "🏘️", Accomplishments: "🏆", Store: "🏪",
  Projects: "🧩", Research: "🔬", Education: "🎓",
  Travel: "✈️", Food: "🍽️", Other: "📁",
  Uncategorized: "📂",
};

const SOCIAL_DOMAINS = [
  "linkedin.com", "instagram.com", "x.com", "twitter.com",
  "facebook.com", "github.com", "youtube.com", "tiktok.com",
  "bsky.app", "spotify.com",
];

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const SOCIAL_ICONS: Record<string, { icon: IoniconName; color: string }> = {
  "linkedin.com":  { icon: "logo-linkedin",  color: "#0077b5" },
  "instagram.com": { icon: "logo-instagram", color: "#e1306c" },
  "x.com":         { icon: "logo-twitter",   color: "#000000" },
  "twitter.com":   { icon: "logo-twitter",   color: "#1da1f2" },
  "facebook.com":  { icon: "logo-facebook",  color: "#1877f2" },
  "github.com":    { icon: "logo-github",    color: "#ffffff" },
  "youtube.com":   { icon: "logo-youtube",   color: "#ff0000" },
  "tiktok.com":    { icon: "logo-tiktok",    color: "#ffffff" },
  "bsky.app":      { icon: "cloud-outline",  color: "#0085ff" },
  "spotify.com":   { icon: "musical-notes",  color: "#1db954" },
};

function getSocialMeta(url: string): { icon: IoniconName; color: string } {
  try {
    const raw = url.startsWith("http") ? url : `https://${url}`;
    const hostname = new URL(raw).hostname.toLowerCase();
    const domain = SOCIAL_DOMAINS.find(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
    return domain && SOCIAL_ICONS[domain]
      ? SOCIAL_ICONS[domain]
      : { icon: "globe-outline", color: "#9ca3af" };
  } catch {
    return { icon: "globe-outline", color: "#9ca3af" };
  }
}

function isSocialUrl(url: string): boolean {
  if (!url) return false;
  try {
    const raw = url.startsWith("http") ? url : `https://${url}`;
    const hostname = new URL(raw).hostname.toLowerCase();
    return SOCIAL_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return SOCIAL_DOMAINS.some((d) => url.toLowerCase().includes(d));
  }
}

function openUrl(url: string) {
  if (!url) return;
  const full = url.startsWith("http") ? url : `https://${url}`;
  Linking.openURL(full).catch(() => {});
}

// ── Shared input style ────────────────────────────────────────────────────────
const INPUT: any = {
  backgroundColor: "rgba(255,255,255,0.08)",
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 14,
  color: "white",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.15)",
};

// ── Add / Edit modal ──────────────────────────────────────────────────────────
interface LinkFormProps {
  visible: boolean;
  editingLink: UserLink | null;
  onClose: () => void;
  onSave: (data: Omit<UserLink, "id">) => Promise<void>;
}

function LinkFormModal({ visible, editingLink, onClose, onSave }: LinkFormProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [extraLink, setExtraLink] = useState("");
  const [extraLinkText, setExtraLinkText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Populate fields when editing
  useEffect(() => {
    if (editingLink) {
      setUrl(editingLink.url || "");
      setTitle(editingLink.title || "");
      setDescription(editingLink.description || "");
      setCategory((editingLink as any).category || null);
      setExtraLink((editingLink as any).extraLink || "");
      setExtraLinkText((editingLink as any).extraLinkText || "");
    } else {
      setUrl(""); setTitle(""); setDescription("");
      setCategory(null); setExtraLink(""); setExtraLinkText("");
    }
    setError(null);
  }, [editingLink, visible]);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (isSocialUrl(val) && !category) setCategory("Social");
  };

  const handleSave = async () => {
    setError(null);
    if (!title.trim() || !url.trim()) {
      setError("Title and URL are required.");
      return;
    }
    const normalizedUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url.trim()
        : `https://${url.trim()}`;
    const payload: Omit<UserLink, "id"> = {
      title: title.trim(),
      url: normalizedUrl,
      description: description.trim(),
      ...(category ? { category } : {}),
      ...(extraLink.trim() ? { extraLink: extraLink.trim() } : {}),
      ...(extraLinkText.trim() ? { extraLinkText: extraLinkText.trim() } : {}),
    };
    // Auto-categorize social links
    if (!category && isSocialUrl(url)) {
      (payload as any).category = "Social";
    }
    setSaving(true);
    try {
      await onSave(payload);
    } catch (e) {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#0a192f",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            maxHeight: "92%",
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />

            <Text style={{ color: "white", fontSize: 18, fontWeight: "700", marginBottom: 20 }}>
              {editingLink ? "Edit Link" : "Add Link"}
            </Text>

            {/* URL */}
            <Text style={labelStyle}>URL *</Text>
            <TextInput
              style={INPUT}
              placeholder="https://example.com"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={url}
              onChangeText={handleUrlChange}
              autoCapitalize="none"
              keyboardType="url"
            />

            {/* Title */}
            <Text style={[labelStyle, { marginTop: 14 }]}>Title *</Text>
            <TextInput
              style={INPUT}
              placeholder="Link title"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text style={[labelStyle, { marginTop: 14 }]}>Description (optional)</Text>
            <TextInput
              style={[INPUT, { height: 80, textAlignVertical: "top" }]}
              placeholder="Short description..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Category */}
            <Text style={[labelStyle, { marginTop: 14, marginBottom: 8 }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 4 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                <PillButton
                  label="None"
                  active={category === null}
                  onPress={() => setCategory(null)}
                />
                {CATEGORIES.map((cat) => (
                  <PillButton
                    key={cat}
                    label={`${CATEGORY_EMOJI[cat] ?? ""} ${cat}`}
                    active={category === cat}
                    onPress={() => setCategory(category === cat ? null : cat)}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Extra link */}
            <Text style={[labelStyle, { marginTop: 14 }]}>Extra link (optional)</Text>
            <TextInput
              style={INPUT}
              placeholder="https://..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={extraLink}
              onChangeText={setExtraLink}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={[labelStyle, { marginTop: 14 }]}>Extra link label (optional)</Text>
            <TextInput
              style={INPUT}
              placeholder="Button text..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={extraLinkText}
              onChangeText={setExtraLinkText}
            />

            {/* Error */}
            {error ? (
              <Text style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</Text>
            ) : null}

            {/* Action buttons */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.3)",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: "white",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#0a192f" />
                ) : (
                  <Text style={{ color: "#0a192f", fontWeight: "700" }}>
                    {editingLink ? "Save Changes" : "Add Link"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
const labelStyle: any = { color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 6 };

function PillButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: active ? "white" : "transparent",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.45)",
      }}
    >
      <Text style={{ color: active ? "#0a192f" : "white", fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Main LinkTree component ───────────────────────────────────────────────────
interface LinkTreeProps {
  userId: string;
  isOwnProfile: boolean;
}

export function LinkTree({ userId, isOwnProfile }: LinkTreeProps) {
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLink, setEditingLink] = useState<UserLink | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getUserLinks(userId)
      .then(setLinks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingLink(null);
    setModalVisible(true);
  };

  const openEdit = (link: UserLink) => {
    setEditingLink(link);
    setModalVisible(true);
  };

  const handleSave = async (data: Omit<UserLink, "id">) => {
    if (editingLink?.id) {
      await updateUserLink(userId, editingLink.id, data);
      setLinks((prev) =>
        prev.map((l) => (l.id === editingLink.id ? { ...l, ...data } : l))
      );
    } else {
      const id = await addUserLink(userId, { ...data, order: links.length });
      setLinks((prev) => [...prev, { id, ...data }]);
    }
    setModalVisible(false);
  };

  const handleDelete = (link: UserLink) => {
    Alert.alert("Delete Link", `Remove "${link.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!link.id) return;
          await deleteUserLink(userId, link.id);
          setLinks((prev) => prev.filter((l) => l.id !== link.id));
        },
      },
    ]);
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  // Social-only links (shown as top icon row)
  const socialLinks = links.filter(
    (l) => isSocialUrl(l.url || "") && (l as any).category === "Social"
  );

  // Card links (everything else)
  const cardLinks = links.filter(
    (l) => !socialLinks.some((s) => s.id === l.id)
  );

  // Group card links by category
  const grouped = cardLinks.reduce<Record<string, UserLink[]>>((acc, l) => {
    const cat = (l as any).category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(l);
    return acc;
  }, {});

  // Ordered present categories
  const allOrdered = [...CATEGORIES, "Uncategorized"];
  const presentCategories = allOrdered.filter((c) => (grouped[c]?.length ?? 0) > 0);
  const visibleCategories = selectedCategory
    ? presentCategories.filter((c) => c === selectedCategory)
    : presentCategories;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ padding: 40, alignItems: "center" }}>
        <ActivityIndicator color="#1e3a6e" />
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: "#0a192f",
        borderRadius: 16,
        margin: 12,
        padding: 16,
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>Links</Text>
        {isOwnProfile && (
          <TouchableOpacity
            onPress={openCreate}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.5)",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>Add link</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Social icons row */}
      {socialLinks.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
        >
          <View style={{ flexDirection: "row", gap: 20, alignItems: "center", paddingVertical: 4 }}>
            {socialLinks.map((link) => {
              const meta = getSocialMeta(link.url || "");
              return (
                <TouchableOpacity
                  key={link.id}
                  onPress={() => openUrl(link.url || "")}
                  onLongPress={() => isOwnProfile && handleDelete(link)}
                  delayLongPress={500}
                >
                  <Ionicons name={meta.icon} size={36} color={meta.color} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Category filter pills */}
      {presentCategories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            <PillButton
              label="All"
              active={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
            />
            {presentCategories.map((cat) => (
              <PillButton
                key={cat}
                label={`${CATEGORY_EMOJI[cat] ?? ""} ${cat}`}
                active={selectedCategory === cat}
                onPress={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Empty state */}
      {links.length === 0 && (
        <Text
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            textAlign: "center",
            paddingVertical: 32,
          }}
        >
          {isOwnProfile
            ? "No links yet. Tap 'Add link' to get started."
            : "This user hasn't added any links yet."}
        </Text>
      )}

      {/* Grouped link cards */}
      {visibleCategories.map((cat) => {
        const items = grouped[cat] || [];
        if (!items.length) return null;
        return (
          <View key={cat}>
            {/* Category divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginVertical: 14,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.15)" }} />
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700" }}>
                {CATEGORY_EMOJI[cat] ? `${CATEGORY_EMOJI[cat]} ` : ""}{cat}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.15)" }} />
            </View>

            {/* Cards */}
            {items.map((link) => (
              <View
                key={link.id}
                style={{
                  backgroundColor: "#020617",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#111827",
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                {/* Tappable content */}
                <TouchableOpacity
                  onPress={() => openUrl(link.url || "")}
                  activeOpacity={0.75}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontWeight: "700",
                      marginBottom: 4,
                    }}
                  >
                    {link.title}
                  </Text>

                  {link.description ? (
                    <Text
                      style={{
                        color: "#d1d5db",
                        fontSize: 13,
                        lineHeight: 19,
                        marginBottom: 6,
                      }}
                      numberOfLines={4}
                    >
                      {link.description}
                    </Text>
                  ) : null}

                  <Text
                    style={{ color: "#6b7280", fontSize: 11 }}
                    numberOfLines={1}
                  >
                    {link.url}
                  </Text>
                </TouchableOpacity>

                {/* Extra link button */}
                {(link as any).extraLink ? (
                  <TouchableOpacity
                    onPress={() => openUrl((link as any).extraLink)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 10,
                      alignSelf: "flex-start",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Ionicons name="open-outline" size={13} color="white" />
                    <Text style={{ color: "white", fontSize: 12 }}>
                      {(link as any).extraLinkText || (link as any).extraLink}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* Edit / Delete (own profile) */}
                {isOwnProfile && (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      marginTop: 12,
                      justifyContent: "flex-end",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => openEdit(link)}
                      style={actionBtn("#1f2937")}
                    >
                      <Ionicons name="pencil-outline" size={13} color="#d1d5db" />
                      <Text style={{ color: "#d1d5db", fontSize: 12 }}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(link)}
                      style={actionBtn("rgba(239,68,68,0.18)")}
                    >
                      <Ionicons name="trash-outline" size={13} color="#f87171" />
                      <Text style={{ color: "#f87171", fontSize: 12 }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      })}

      {/* Add / Edit modal */}
      <LinkFormModal
        visible={modalVisible}
        editingLink={editingLink}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

function actionBtn(bg: string): any {
  return {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: bg,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  };
}
