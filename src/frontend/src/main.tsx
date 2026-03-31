import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT REMOVE LanguageProvider OR AutoLockProvider
// These providers MUST remain here in main.tsx permanently.
// Removing them causes white screens and broken translations.
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
  // DO NOT REMOVE: LanguageProvider must wrap the entire app
  <LanguageProvider>
    {/* DO NOT REMOVE: AutoLockProvider must wrap the entire app */}
    <AutoLockProvider>
      <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
          <App />
        </InternetIdentityProvider>
      </QueryClientProvider>
    </AutoLockProvider>
  </LanguageProvider>,
);
