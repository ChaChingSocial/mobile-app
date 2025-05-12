export interface TypewriterProps {
  textArray: string[];
  speed?: number;
  loop?: boolean;
  delay?: number;
  textStyle?: string;
  cursorStyle?: string;
  colors?: string[];
}

export type SessionValue = {
  uid: string;
  email: string | null;
  displayName: string | null;
  profilePic: string | null;
};
