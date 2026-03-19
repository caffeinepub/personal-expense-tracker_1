import { Button } from "@/components/ui/button";
import { Fingerprint, Lock, ShieldAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useAutoLock } from "../contexts/AutoLockContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LockScreen() {
  const { isLocked, unlock, unlockWithII, hasPin, pinLength } = useAutoLock();
  const { login, isLoggingIn } = useInternetIdentity();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLocked) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setPin("");
      setError("");
    }
  }, [isLocked]);

  async function handleUnlock() {
    if (pin.length < pinLength) {
      setError("Enter your PIN to unlock");
      return;
    }
    setIsChecking(true);
    const ok = await unlock(pin);
    setIsChecking(false);
    if (!ok) {
      setError("Incorrect PIN. Try again.");
      setPin("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setPin("");
      setError("");
    }
  }

  async function handleIIUnlock() {
    setError("");
    try {
      await login();
      unlockWithII();
    } catch {
      setError("Authentication failed. Try again.");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && pin.length >= pinLength && !isChecking && hasPin) {
      handleUnlock();
    }
  }

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          key="lock-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            background: "oklch(0.08 0.02 250 / 0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
          data-ocid="lock.modal"
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            {/* Header */}
            <div
              className="px-6 pt-8 pb-6 text-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.25 0.06 250), oklch(0.18 0.04 260))",
              }}
            >
              <div
                className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4"
                style={{
                  background: "oklch(0.35 0.12 250 / 0.4)",
                  border: "1px solid oklch(0.5 0.15 250 / 0.3)",
                }}
              >
                <Lock
                  className="w-8 h-8"
                  style={{ color: "oklch(0.8 0.12 250)" }}
                />
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">
                Session Locked
              </h2>
              <p className="text-sm" style={{ color: "oklch(0.7 0.05 250)" }}>
                Your session locked due to inactivity
              </p>
            </div>

            {/* PIN section */}
            <div className="px-6 py-6 space-y-5">
              {hasPin && (
                <>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your {pinLength}-digit PIN
                    </p>

                    {/* PIN slots + invisible real input overlay */}
                    <div
                      className="relative flex gap-2 justify-center"
                      onClick={() => inputRef.current?.focus()}
                      onKeyDown={() => inputRef.current?.focus()}
                    >
                      {/* Visual PIN slots */}
                      {[...Array(pinLength)].map((_, slotIdx) => (
                        <div
                          key={slotIdx.toString()}
                          className={`w-11 h-12 rounded-lg border flex items-center justify-center text-xl font-bold transition-colors select-none ${
                            slotIdx < pin.length
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          {slotIdx < pin.length ? "●" : ""}
                        </div>
                      ))}

                      {/* Real input: covers the PIN slot area, invisible but interactive */}
                      <input
                        ref={inputRef}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        maxLength={pinLength}
                        value={pin}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, pinLength);
                          setPin(val);
                          setError("");
                        }}
                        onKeyDown={handleKeyDown}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ fontSize: 16 }}
                        data-ocid="lock.input"
                      />
                    </div>

                    {error && (
                      <div
                        className="flex items-center justify-center gap-1.5 mt-3 text-sm text-destructive"
                        data-ocid="lock.error_state"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        {error}
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full h-11"
                    onClick={handleUnlock}
                    disabled={pin.length < pinLength || isChecking}
                    data-ocid="lock.primary_button"
                  >
                    {isChecking ? "Checking..." : "Unlock"}
                  </Button>

                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                </>
              )}

              <Button
                variant="outline"
                className="w-full h-11 gap-2"
                onClick={handleIIUnlock}
                disabled={isLoggingIn}
                data-ocid="lock.secondary_button"
              >
                <Fingerprint className="w-4 h-4" />
                {isLoggingIn
                  ? "Authenticating..."
                  : "Unlock with Internet Identity"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
