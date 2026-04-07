import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AutoLockProvider } from "./contexts/AutoLockContext";
import "./index.css";
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
      {/* ─── PERMANENT: LanguageProvider — DO NOT REMOVE ─────────────────────
          This provider must always wrap the entire app. Removing it breaks all
          translations across every tab and component. Comment guard is intentional.
      ─────────────────────────────────────────────────────────────────────── */}
      <LanguageProvider>
        {/* ─── PERMANENT: AutoLockProvider — DO NOT REMOVE ──────────────────────
            This provider manages PIN/auto-lock state. Removing it crashes the
            lock screen and Danger Zone. Comment guard is intentional.
        ─────────────────────────────────────────────────────────────────────── */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
