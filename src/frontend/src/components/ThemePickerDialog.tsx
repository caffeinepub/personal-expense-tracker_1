import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { CARD_THEMES, type CardThemeId } from "../hooks/useCardTheme";
import { useLanguage } from "../i18n/LanguageContext";

interface ThemePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedThemeId: CardThemeId;
  onSelect: (id: CardThemeId) => void;
}

export default function ThemePickerDialog({
  open,
  onOpenChange,
  selectedThemeId,
  onSelect,
}: ThemePickerDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm rounded-2xl p-5"
        data-ocid="theme_picker.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {t("card_theme")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {CARD_THEMES.map((theme, index) => {
            const isSelected = theme.id === selectedThemeId;
            return (
              <button
                key={theme.id}
                type="button"
                data-ocid={`theme_picker.item.${index + 1}`}
                onClick={() => {
                  onSelect(theme.id);
                  onOpenChange(false);
                }}
                className={`relative h-20 rounded-xl overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected
                    ? "ring-2 ring-white/80 ring-offset-2 ring-offset-background scale-[1.02]"
                    : "hover:scale-[1.02] hover:ring-2 hover:ring-white/40 hover:ring-offset-1 hover:ring-offset-background"
                }`}
                style={{ background: theme.gradient }}
              >
                {/* Theme name */}
                <span className="absolute bottom-0 inset-x-0 px-3 py-2 text-xs font-semibold text-white/90 bg-gradient-to-t from-black/40 to-transparent">
                  {theme.name}
                </span>

                {/* Selected checkmark */}
                {isSelected && (
                  <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-white drop-shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
