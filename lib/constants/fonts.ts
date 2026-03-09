/**
 * Bricolage Grotesque font family names.
 *
 * Usage:
 *   import { Fonts } from "@/lib/constants/fonts";
 *   <Text style={{ fontFamily: Fonts.semiBold }}>Hello</Text>
 *
 * React Native requires an explicit fontFamily per weight — fontWeight alone
 * won't switch variants on Android when using custom fonts.
 */
export const Fonts = {
    extraLight: "BricolageGrotesque-ExtraLight",
    light: "BricolageGrotesque-Light",
    regular: "BricolageGrotesque-Regular",
    medium: "BricolageGrotesque-Medium",
    semiBold: "BricolageGrotesque-SemiBold",
    bold: "BricolageGrotesque-Bold",
    extraBold: "BricolageGrotesque-ExtraBold",
} as const;
