import { useEffect, useCallback, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { SessionValue } from "@/types";

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

function useAsyncState<T>(
  initialValue: [boolean, T | null] = [true, null]
): UseStateHook<T> {
  return useReducer(
    (
      state: [boolean, T | null],
      action: T | null = null
    ): [boolean, T | null] => [false, action],
    initialValue
  ) as UseStateHook<T>;
}

export async function setStorageItemAsync(
  key: string,
  value: SessionValue | null
) {
  if (Platform.OS === "web") {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.error("Local storage is unavailable:", e);
    }
  } else {
    if (value == null) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  }
}

export function useStorageState(key: string): UseStateHook<SessionValue> {
  // Public
  const [state, setState] = useAsyncState<SessionValue>();

  // Get
  useEffect(() => {
    const getValue = async () => {
      if (Platform.OS === "web") {
        try {
          if (typeof localStorage !== "undefined") {
            const item = localStorage.getItem(key);
            setState(item ? JSON.parse(item) : null);
          }
        } catch (e) {
          console.error("Local storage is unavailable:", e);
        }
      } else {
        try {
          const value = await AsyncStorage.getItem(key);
          setState(value ? JSON.parse(value) : null);
        } catch (e) {
          console.error("AsyncStorage error:", e);
        }
      }
    };

    getValue();
  }, [key]);

  // Set
  const setValue = useCallback(
    (value: SessionValue | null) => {
      setState(value);
      setStorageItemAsync(key, value);
    },
    [key]
  );

  return [state, setValue];
}
