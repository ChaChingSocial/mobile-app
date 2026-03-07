/**
 * bgImages.ts – local background image registry.
 *
 * HOW TO ADD A NEW BACKGROUND IMAGE:
 *  1. Drop the image file into  assets/images/bg-images/  (e.g. bg4.jpg)
 *  2. Add a new entry below:    "/bg-images/bg4.jpg": require("@/assets/images/bg-images/bg4.jpg"),
 *  3. Save – Metro will pick it up on the next reload.
 *
 * The path string (key) must exactly match what is stored in Firestore
 * under  users/{userId}/profile/{userId}.backgroundImage
 */

import { ImageSourcePropType } from "react-native";

// ─── Add your entries here ────────────────────────────────────────────────────
// Each key is the Firestore-stored path; each value is the bundled asset.
const BG_IMAGE_MAP: Record<string, ImageSourcePropType> = {
  // "/bg-images/bg1.jpg": require("@/assets/images/bg-images/bg1.jpg"),
  // "/bg-images/bg2.jpg": require("@/assets/images/bg-images/bg2.jpg"),
  // "/bg-images/bg3.jpg": require("@/assets/images/bg-images/bg3.jpg"),
  // Add more entries here as you add image files to the folder.
};

/**
 * Returns the local ImageSource for a stored path like "/bg-images/bg3.jpg",
 * or null if the path isn't in the map (caller should fall back to Firebase).
 */
export function resolveLocalBgImage(path: string): ImageSourcePropType | null {
  return BG_IMAGE_MAP[path] ?? null;
}

/**
 * All registered local presets — use this to populate the preset picker
 * in BackgroundImageModal without touching Firebase Storage.
 */
export const LOCAL_BG_PRESETS: { path: string; source: ImageSourcePropType }[] =
  Object.entries(BG_IMAGE_MAP).map(([path, source]) => ({ path, source }));
