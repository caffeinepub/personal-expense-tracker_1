import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT REMOVE OR MODIFY THE PROVIDERS BELOW
// LanguageProvider and AutoLockProvider MUST stay at the root.
// Removing them will cause white screen crashes and break all translations.
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
  // DO NOT REMOVE: LanguageProvider must wrap App at the root
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      {/* DO NOT REMOVE: LanguageProvider - required for all translations */}
      <LanguageProvider>
        {/* DO NOT REMOVE: AutoLockProvider - required for session security */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
