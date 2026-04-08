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
      {/* ============================================================
          DO NOT REMOVE: LanguageProvider must stay here permanently.
          It provides translations to the entire app. Removing it
          will cause all useLanguage() calls to fail silently.
          ============================================================ */}
      <LanguageProvider>
        {/* ============================================================
            DO NOT REMOVE: AutoLockProvider must stay here permanently.
            It provides auto-lock/PIN security to the entire app.
            Removing it will cause all useAutoLock() calls to use
            no-op defaults and the lock screen will never activate.
            ============================================================ */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
