import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BookOpen, Copy, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Expense } from "../backend.d";

interface NotesHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allExpenses: Expense[];
}

interface NoteEntry {
  note: string;
  count: number;
}

export default function NotesHistorySheet({
  open,
  onOpenChange,
  allExpenses,
}: NotesHistorySheetProps) {
  const [search, setSearch] = useState("");

  const noteEntries = useMemo((): NoteEntry[] => {
    const countMap = new Map<string, number>();
    for (const e of allExpenses) {
      const note = e.note?.trim();
      if (!note) continue;
      countMap.set(note, (countMap.get(note) ?? 0) + 1);
    }
    return Array.from(countMap.entries())
      .map(([note, count]) => ({ note, count }))
      .sort((a, b) => b.count - a.count);
  }, [allExpenses]);

  const filtered = useMemo(() => {
    if (!search.trim()) return noteEntries;
    const q = search.toLowerCase();
    return noteEntries.filter((e) => e.note.toLowerCase().includes(q));
  }, [noteEntries, search]);

  async function copyNote(note: string) {
    try {
      await navigator.clipboard.writeText(note);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md mx-auto rounded-2xl max-h-[80vh] flex flex-col"
        data-ocid="notes_history.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Notes History
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
            data-ocid="notes_history.search_input"
          />
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-8"
              data-ocid="notes_history.empty_state"
            >
              {allExpenses.length === 0
                ? "No expenses yet"
                : "No notes match your search"}
            </p>
          ) : (
            <ul className="space-y-1 py-1">
              {filtered.map((entry, i) => (
                <li
                  key={entry.note}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors group"
                  data-ocid={`notes_history.item.${i + 1}`}
                >
                  <span className="flex-1 text-sm truncate">{entry.note}</span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 h-4 flex-shrink-0"
                  >
                    {entry.count}×
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={() => copyNote(entry.note)}
                    aria-label="Copy note"
                    data-ocid={`notes_history.copy_button.${i + 1}`}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          {noteEntries.length} unique notes across all expenses
        </p>
      </DialogContent>
    </Dialog>
  );
}
