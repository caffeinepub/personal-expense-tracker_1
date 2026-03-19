import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAutoLock } from "../contexts/AutoLockContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "change";
  onSuccess?: () => void;
}

type Step = "current" | "new" | "confirm";

export default function CreatePINDialog({
  open,
  onOpenChange,
  mode,
  onSuccess,
}: Props) {
  const { setPin, unlock } = useAutoLock();
  const [step, setStep] = useState<Step>(mode === "change" ? "current" : "new");
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  function reset() {
    setStep(mode === "change" ? "current" : "new");
    setCurrentPinInput("");
    setNewPinInput("");
    setConfirmPinInput("");
    setError("");
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function handleNext() {
    setError("");
    setIsProcessing(true);
    try {
      if (step === "current") {
        const ok = await unlock(currentPinInput);
        if (!ok) {
          setError("Incorrect PIN. Try again.");
          setCurrentPinInput("");
          return;
        }
        setStep("new");
      } else if (step === "new") {
        if (newPinInput.length < 4) {
          setError("PIN must be at least 4 digits.");
          return;
        }
        setStep("confirm");
      } else if (step === "confirm") {
        if (confirmPinInput !== newPinInput) {
          setError("PINs do not match. Try again.");
          setConfirmPinInput("");
          return;
        }
        await setPin(newPinInput);
        onSuccess?.();
        handleClose(false);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  const stepTitle =
    step === "current"
      ? "Enter Current PIN"
      : step === "new"
        ? mode === "create"
          ? "Create PIN"
          : "Enter New PIN"
        : "Confirm PIN";

  const stepDesc =
    step === "current"
      ? "Verify your current PIN before changing it"
      : step === "new"
        ? "Choose a numeric PIN (4–6 digits)"
        : "Re-enter your PIN to confirm";

  const activePin =
    step === "current"
      ? currentPinInput
      : step === "new"
        ? newPinInput
        : confirmPinInput;

  const setActivePin = (val: string) => {
    setError("");
    if (step === "current") setCurrentPinInput(val);
    else if (step === "new") setNewPinInput(val);
    else setConfirmPinInput(val);
  };

  const canProceed = activePin.length >= 4;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm" data-ocid="pin.dialog">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {mode === "create" ? "Set Up PIN" : "Change PIN"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Progress indicators */}
          {mode === "change" && (
            <div className="flex gap-2 justify-center">
              {(["current", "new", "confirm"] as Step[]).map((s) => (
                <div
                  key={s}
                  className="h-1 rounded-full flex-1 transition-colors"
                  style={{
                    backgroundColor:
                      s === step
                        ? "oklch(var(--primary))"
                        : ["current", "new", "confirm"].indexOf(s) <
                            ["current", "new", "confirm"].indexOf(step)
                          ? "oklch(var(--primary) / 0.5)"
                          : "oklch(var(--border))",
                  }}
                />
              ))}
            </div>
          )}

          <div className="text-center">
            <p className="text-sm font-medium mb-0.5">{stepTitle}</p>
            <p className="text-xs text-muted-foreground">{stepDesc}</p>
          </div>

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={activePin}
              onChange={setActivePin}
              inputMode="numeric"
              pattern="[0-9]*"
              data-ocid="pin.input"
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="w-11 h-12 text-lg rounded-lg"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <div
              className="flex items-center justify-center gap-1.5 text-sm text-destructive"
              data-ocid="pin.error_state"
            >
              <ShieldAlert className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            data-ocid="pin.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed || isProcessing}
            data-ocid="pin.confirm_button"
          >
            {step === "confirm"
              ? isProcessing
                ? "Saving..."
                : "Save PIN"
              : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
