import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const STEPS = [
  {
    emoji: "🎉",
    title: "Welcome to PE Tracker!",
    body: "Track your expenses, manage budgets, and reach your savings goals — all private and on-chain. Your data is stored only in your personal canister on the Internet Computer.",
  },
  {
    emoji: "📊",
    title: "Your Dashboard",
    body: "See your spending at a glance. The Spent Card shows your total vs income. Charts break down spending by category. The Income Source section tracks all your income streams.",
  },
  {
    emoji: "➕",
    title: "Add Expenses Easily",
    body: "Tap the + button to log an expense or income. You can add categories, set recurring schedules, attach photo receipts, and tag transactions for easy filtering.",
  },
  {
    emoji: "⚙️",
    title: "You're All Set!",
    body: "Explore Settings to customize categories, set budgets, configure your security PIN, and manage your income sources. Have questions? Check the About section.",
    cta: "Get Started",
  },
];

interface OnboardingTourProps {
  onDone: () => void;
}

export default function OnboardingTour({ onDone }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function handleNext() {
    if (isLast) {
      onDone();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <Dialog open onOpenChange={() => onDone()}>
      <DialogContent
        className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden"
        data-ocid="onboarding.dialog"
      >
        {/* Progress bar */}
        <div className="flex gap-1 px-5 pt-5">
          {STEPS.map((_, i) => (
            <div
              key={i.toString()}
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{
                background:
                  i <= step
                    ? "oklch(0.52 0.17 145)"
                    : "oklch(0.85 0.02 145 / 0.3)",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-6 py-5 text-center space-y-3"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-4xl"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.52 0.17 145 / 0.15), oklch(0.42 0.15 145 / 0.08))",
                border: "1px solid oklch(0.52 0.17 145 / 0.2)",
              }}
            >
              {current.emoji}
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                {current.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {current.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {STEPS.map((_, i) => (
            <div
              key={i.toString()}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? "20px" : "6px",
                height: "6px",
                background:
                  i === step
                    ? "oklch(0.52 0.17 145)"
                    : "oklch(0.7 0.02 145 / 0.4)",
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 pb-6">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex-1"
              data-ocid="onboarding.back_button"
            >
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={onDone}
              className="flex-1 text-muted-foreground"
              data-ocid="onboarding.skip_button"
            >
              Skip
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            data-ocid={
              isLast ? "onboarding.getstarted_button" : "onboarding.next_button"
            }
          >
            {isLast ? (current.cta ?? "Get Started") : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
