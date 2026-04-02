import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "./index.css";
import { AutoLockProvider } from "./contexts/AutoLockContext";
// ─── PERMANENT PROVIDERS — DO NOT REMOVE ───────────────────────────────────
// LanguageProvider and AutoLockProvider MUST wrap App at all times.
// Removing them causes translation failures and app crashes.
// ───────────────────────────────────────────────────────────────────────────
import { LanguageProvider } from "./i18n/LanguageContext";

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
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      {/* ─── PERMANENT: LanguageProvider must stay here ─────────────── */}
      <LanguageProvider>
        {/* ─── PERMANENT: AutoLockProvider must stay here ──────────── */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
      {/* ─────────────────────────────────────────────────────────────── */}
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
