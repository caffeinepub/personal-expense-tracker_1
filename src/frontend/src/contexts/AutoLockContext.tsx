import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const LS_ENABLED = "pe_autolock_enabled";
const LS_MINUTES = "pe_autolock_minutes";
const LS_PIN = "pe_pin";
const LS_PIN_LENGTH = "pe_pin_length";

// Simple hash using Web Crypto API
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${pin}pe_salt_v1`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface AutoLockContextValue {
  enabled: boolean;
  lockAfterMinutes: number;
  isLocked: boolean;
  hasPin: boolean;
  pinLength: number;
  setEnabled: (val: boolean) => void;
  setLockAfterMinutes: (val: number) => void;
  setPin: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  unlockWithII: () => void;
  lockNow: () => void;
}

const defaultContextValue: AutoLockContextValue = {
  enabled: false,
  lockAfterMinutes: 5,
  isLocked: false,
  hasPin: false,
  pinLength: 4,
  setEnabled: () => {},
  setLockAfterMinutes: () => {},
  setPin: async () => {},
  unlock: async () => false,
  unlockWithII: () => {},
  lockNow: () => {},
};

const AutoLockContext =
  createContext<AutoLockContextValue>(defaultContextValue);

export function AutoLockProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(() => {
    try {
      return localStorage.getItem(LS_ENABLED) === "true";
    } catch {
      return false;
    }
  });
  const [lockAfterMinutes, setLockAfterMinutesState] = useState<number>(() => {
    try {
      const val = localStorage.getItem(LS_MINUTES);
      return val ? Number(val) : 5;
    } catch {
      return 5;
    }
  });
  const [isLocked, setIsLocked] = useState(false);
  const [storedHash, setStoredHash] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LS_PIN);
    } catch {
      return null;
    }
  });
  const [pinLength, setPinLengthState] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(LS_PIN_LENGTH) ?? "4");
    } catch {
      return 4;
    }
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled || lockAfterMinutes === 0) return;
    timerRef.current = setTimeout(
      () => {
        setIsLocked(true);
      },
      lockAfterMinutes * 60 * 1000,
    );
  }, [enabled, lockAfterMinutes]);

  // Activity listeners
  useEffect(() => {
    if (!enabled || lockAfterMinutes === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    const events = ["mousemove", "keydown", "touchstart", "click"];
    const handler = () => resetTimer();
    for (const e of events) {
      window.addEventListener(e, handler, { passive: true });
    }
    resetTimer();
    return () => {
      for (const e of events) {
        window.removeEventListener(e, handler);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, lockAfterMinutes, resetTimer]);

  const setEnabled = useCallback((val: boolean) => {
    setEnabledState(val);
    try {
      localStorage.setItem(LS_ENABLED, String(val));
    } catch {}
  }, []);

  const setLockAfterMinutes = useCallback((val: number) => {
    setLockAfterMinutesState(val);
    try {
      localStorage.setItem(LS_MINUTES, String(val));
    } catch {}
  }, []);

  const setPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin);
    try {
      localStorage.setItem(LS_PIN, hash);
      localStorage.setItem(LS_PIN_LENGTH, String(pin.length));
    } catch {}
    setStoredHash(hash);
    setPinLengthState(pin.length);
  }, []);

  const unlock = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!storedHash) return false;
      const hash = await hashPin(pin);
      if (hash === storedHash) {
        setIsLocked(false);
        resetTimer();
        return true;
      }
      return false;
    },
    [storedHash, resetTimer],
  );

  const unlockWithII = useCallback(() => {
    setIsLocked(false);
    resetTimer();
  }, [resetTimer]);

  const lockNow = useCallback(() => {
    setIsLocked(true);
  }, []);

  return (
    <AutoLockContext.Provider
      value={{
        enabled,
        lockAfterMinutes,
        isLocked,
        hasPin: !!storedHash,
        pinLength,
        setEnabled,
        setLockAfterMinutes,
        setPin,
        unlock,
        unlockWithII,
        lockNow,
      }}
    >
      {children}
    </AutoLockContext.Provider>
  );
}

// Safe hook — returns default no-op values instead of throwing if provider is missing
export function useAutoLock(): AutoLockContextValue {
  return useContext(AutoLockContext);
}
