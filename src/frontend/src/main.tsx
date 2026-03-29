import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "./index.css";
import { AutoLockProvider } from "./contexts/AutoLockContext";
// ─── PERMANENT PROVIDERS — DO NOT REMOVE ───────────────────────────────────────
// LanguageProvider and AutoLockProvider MUST stay here. Removing them causes
// translation failures (raw keys) and white-screen crashes.
import { LanguageProvider } from "./i18n/LanguageContext";
// ───────────────────────────────────────────────────────────────────────────────

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
      {/* ─── PERMANENT: LanguageProvider — DO NOT REMOVE ─── */}
      <LanguageProvider>
        {/* ─── PERMANENT: AutoLockProvider — DO NOT REMOVE ─── */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
