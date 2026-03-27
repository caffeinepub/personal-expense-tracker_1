import { Button } from "@/components/ui/button";
import { Delete, Fingerprint, Lock, ShieldAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useAutoLock } from "../contexts/AutoLockContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LockScreen() {
  const { isLocked, unlock, unlockWithII, hasPin, pinLength } = useAutoLock();
  // identity is used to detect if user is already authenticated with II
  const { identity, login, isLoggingIn, isLoginSuccess, isLoginError } =
    useInternetIdentity();
  const [iiPending, setIiPending] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  // Refs to avoid stale closures in keyboard handler
  const pinRef = useRef("");
  const isCheckingRef = useRef(false);
  const pinLengthRef = useRef(pinLength);
  const unlockRef = useRef(unlock);

  // Keep refs in sync with state
  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);
  useEffect(() => {
    isCheckingRef.current = isChecking;
  }, [isChecking]);
  useEffect(() => {
    pinLengthRef.current = pinLength;
  }, [pinLength]);
  useEffect(() => {
    unlockRef.current = unlock;
  }, [unlock]);

  useEffect(() => {
    if (!isLocked) {
      setPin("");
      pinRef.current = "";
      setError("");
    }
  }, [isLocked]);

  async function performUnlock(pinToCheck: string) {
    const len = pinLengthRef.current;
    if (pinToCheck.length < len) {
      setError("Enter your PIN to unlock");
      return;
    }
    setIsChecking(true);
    isCheckingRef.current = true;
    const ok = await unlockRef.current(pinToCheck);
    setIsChecking(false);
    isCheckingRef.current = false;
    if (!ok) {
      setError("Incorrect PIN. Try again.");
      setPin("");
      pinRef.current = "";
    } else {
      setPin("");
      pinRef.current = "";
      setError("");
    }
  }

  // Keyboard support — stable listener, uses refs to avoid stale closures
  // biome-ignore lint/correctness/useExhaustiveDependencies: performUnlock intentionally uses refs
  useEffect(() => {
    if (!isLocked) return;

    function onKeyDown(e: KeyboardEvent) {
      if (isCheckingRef.current) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setError("");
        setPin((prev) => {
          const next = (prev + e.key).slice(0, pinLengthRef.current);
          pinRef.current = next;
          if (next.length === pinLengthRef.current) {
            // Small delay so state update is committed before async unlock
            setTimeout(() => performUnlock(next), 0);
          }
          return next;
        });
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setError("");
        setPin((prev) => {
          const next = prev.slice(0, -1);
          pinRef.current = next;
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        performUnlock(pinRef.current);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked]);

  async function handleUnlock(currentPin?: string) {
    await performUnlock(currentPin ?? pinRef.current);
  }

  // Only watch isLoginSuccess/isLoginError if we actually triggered a fresh login
  useEffect(() => {
    if (iiPending && isLoginSuccess) {
      setIiPending(false);
      unlockWithII();
    }
  }, [isLoginSuccess, iiPending, unlockWithII]);

  useEffect(() => {
    if (iiPending && isLoginError) {
      setIiPending(false);
      setError("Authentication failed. Try again.");
    }
  }, [isLoginError, iiPending]);

  function handleIIUnlock() {
    setError("");

    // If the user already has a valid Internet Identity session, unlock directly.
    // Calling login() when already authenticated causes the hook to set isLoginError
    // ("User is already authenticated"), which incorrectly shows "Authentication failed".
    if (identity && !identity.getPrincipal().isAnonymous()) {
      unlockWithII();
      return;
    }

    // No active session — trigger a fresh II login
    setIiPending(true);
    login();
  }

  function handleDigit(digit: string) {
    if (isChecking) return;
    setError("");
    const next = (pin + digit).slice(0, pinLength);
    setPin(next);
    pinRef.current = next;
    if (next.length === pinLength) {
      performUnlock(next);
    }
  }

  function handleBackspace() {
    if (isChecking) return;
    const next = pin.slice(0, -1);
    setPin(next);
    pinRef.current = next;
    setError("");
  }

  const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["empty", "0", "backspace"],
  ];

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
            <div className="px-6 py-6 space-y-4">
              {hasPin && (
                <>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your {pinLength}-digit PIN
                      <span className="block text-xs text-muted-foreground/60 mt-0.5">
                        Use keypad below or physical keyboard
                      </span>
                    </p>

                    {/* PIN slots */}
                    <div className="flex gap-2 justify-center mb-4">
                      {[...Array(pinLength)].map((_, slotIdx) => (
                        <div
                          key={slotIdx.toString()}
                          className={`w-11 h-12 rounded-lg border flex items-center justify-center text-xl font-bold transition-all duration-150 select-none ${
                            slotIdx < pin.length
                              ? "border-primary bg-primary/10"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          {slotIdx < pin.length ? (
                            <span className="w-3 h-3 rounded-full bg-foreground inline-block" />
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {error && (
                      <div
                        className="flex items-center justify-center gap-1.5 mb-3 text-sm text-destructive"
                        data-ocid="lock.error_state"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        {error}
                      </div>
                    )}

                    {/* Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
                      {keypadRows.map((row, _rowIdx) =>
                        row.map((key) => {
                          if (key === "empty") {
                            return (
                              <div key="empty-key" className="w-full h-12" />
                            );
                          }
                          if (key === "backspace") {
                            return (
                              <button
                                key="backspace"
                                type="button"
                                onClick={handleBackspace}
                                disabled={isChecking || pin.length === 0}
                                className="w-full h-12 rounded-xl bg-muted hover:bg-muted/80 text-lg font-semibold transition-colors flex items-center justify-center disabled:opacity-30"
                                data-ocid="lock.delete_button"
                              >
                                <Delete className="w-5 h-5" />
                              </button>
                            );
                          }
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleDigit(key)}
                              disabled={isChecking}
                              className="w-full h-12 rounded-xl bg-muted hover:bg-muted/80 text-lg font-semibold transition-colors disabled:opacity-50"
                              data-ocid={"lock.button"}
                            >
                              {key}
                            </button>
                          );
                        }),
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full h-11"
                    onClick={() => handleUnlock()}
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
                disabled={iiPending || isLoggingIn}
                data-ocid="lock.secondary_button"
              >
                <Fingerprint className="w-4 h-4" />
                {iiPending || isLoggingIn
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
