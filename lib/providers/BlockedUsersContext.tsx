import React, { createContext, useContext, useEffect, useState } from "react";
import { onSnapshot, collection } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { app } from "@/config/firebase";
import {
  blockUser as blockUserApi,
  unblockUser as unblockUserApi,
  isUserBlocked as isUserBlockedApi,
  getBlockedUsers as getBlockedUsersApi,
} from "@/lib/api/user";
import { useSession } from "./AuthContext";

const db = getFirestore(app);

interface BlockedUsersContextType {
  blockedUsers: string[];
  blockUser: (
    blockedUserId: string,
    reason?: string,
    abuseReportId?: string
  ) => Promise<boolean>;
  unblockUser: (blockedUserId: string) => Promise<boolean>;
  isBlocked: (userId: string) => boolean;
  loading: boolean;
}

const BlockedUsersContext = createContext<BlockedUsersContextType | undefined>(
  undefined
);

export function BlockedUsersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useSession();
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.uid) {
      setBlockedUsers([]);
      setLoading(false);
      return;
    }

    // Set up real-time listener for blocked users
    const blockedUsersRef = collection(
      db,
      "users",
      session.uid,
      "blockedUsers"
    );

    const unsubscribe = onSnapshot(
      blockedUsersRef,
      (snapshot) => {
        const blocked = snapshot.docs.map((doc) => doc.id);
        setBlockedUsers(blocked);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to blocked users:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [session?.uid]);

  const blockUser = async (
    blockedUserId: string,
    reason?: string,
    abuseReportId?: string
  ): Promise<boolean> => {
    if (!session?.uid) return false;

    const success = await blockUserApi(
      session.uid,
      blockedUserId,
      reason,
      abuseReportId
    );

    if (success) {
      // Optimistically update state (real-time listener will sync)
      setBlockedUsers((prev) => [...prev, blockedUserId]);
    }

    return success;
  };

  const unblockUser = async (blockedUserId: string): Promise<boolean> => {
    if (!session?.uid) return false;

    const success = await unblockUserApi(session.uid, blockedUserId);

    if (success) {
      // Optimistically update state
      setBlockedUsers((prev) => prev.filter((id) => id !== blockedUserId));
    }

    return success;
  };

  const isBlocked = (userId: string): boolean => {
    return blockedUsers.includes(userId);
  };

  return (
    <BlockedUsersContext.Provider
      value={{ blockedUsers, blockUser, unblockUser, isBlocked, loading }}
    >
      {children}
    </BlockedUsersContext.Provider>
  );
}

export function useBlockedUsers() {
  const context = useContext(BlockedUsersContext);
  if (context === undefined) {
    throw new Error(
      "useBlockedUsers must be used within a BlockedUsersProvider"
    );
  }
  return context;
}
