import { useStorageState } from "@/hooks/useStorageState";
import {
  useContext,
  createContext,
  type PropsWithChildren,
  useEffect,
} from "react";
import { router, SplashScreen } from "expo-router";

SplashScreen.preventAutoHideAsync();

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("session");
  console.log("session", session);
  console.log("isLoading", isLoading);

  useEffect(() => {
    if (isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <AuthContext.Provider
      value={{
        signIn: () => {
          // Perform sign-in logic here
          setSession("xxx");
          router.replace("/(protected)/(home)");
        },
        signOut: () => {
          setSession(null);
          router.replace("/login");
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
