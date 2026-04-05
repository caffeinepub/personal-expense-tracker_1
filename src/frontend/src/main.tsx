import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: LanguageProvider and AutoLockProvider are
// permanently anchored here. DO NOT remove or move them.
// Removing these providers causes translation failures and
// app crashes. This file is never regenerated during builds.
// ============================================================
import ReactDOM from "react-dom/client";
import App from "./App";
import { AutoLockProvider } from "./contexts/AutoLockContext";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import { LanguageProvider } from "./i18n/LanguageContext";
import "./index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  // ── DO NOT REMOVE LanguageProvider ──────────────────────
  <LanguageProvider>
    {/* ── DO NOT REMOVE AutoLockProvider ─────────────────── */}
    <AutoLockProvider>
      <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
          <App />
        </InternetIdentityProvider>
      </QueryClientProvider>
    </AutoLockProvider>
  </LanguageProvider>,
);
