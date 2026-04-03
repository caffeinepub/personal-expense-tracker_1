import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "./index.css";
import { AutoLockProvider } from "./contexts/AutoLockContext";
// ============================================================
// PERMANENT PROVIDERS — DO NOT REMOVE OR REORDER
// LanguageProvider and AutoLockProvider MUST wrap the entire app.
// Removing them causes white screens and translation failures.
// ============================================================
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
  // PERMANENT: LanguageProvider and AutoLockProvider must always wrap the entire app
  <LanguageProvider>
    <AutoLockProvider>
      <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
          <App />
        </InternetIdentityProvider>
      </QueryClientProvider>
    </AutoLockProvider>
  </LanguageProvider>,
);
