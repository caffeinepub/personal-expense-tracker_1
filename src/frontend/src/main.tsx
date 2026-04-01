import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ⚠️ DO NOT REMOVE - LanguageProvider and AutoLockProvider must ALWAYS wrap the app
// These providers are critical for translations and session security.
// Removing them will cause white screens and translation failures.
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
  // ⚠️ DO NOT REMOVE LanguageProvider - required for all translations
  <LanguageProvider>
    {/* ⚠️ DO NOT REMOVE AutoLockProvider - required for session security */}
    <AutoLockProvider>
      <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
          <App />
        </InternetIdentityProvider>
      </QueryClientProvider>
    </AutoLockProvider>
  </LanguageProvider>,
);
