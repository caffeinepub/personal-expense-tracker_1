import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT REMOVE LanguageProvider or AutoLockProvider
// Both providers MUST remain here for the app to function.
// Removing them causes white screens and broken translations.
// ============================================================
import ReactDOM from "react-dom/client";
import App from "./App";
// PERMANENT ANCHOR: AutoLockProvider must stay at app root
import { AutoLockProvider } from "./contexts/AutoLockContext";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
// PERMANENT ANCHOR: LanguageProvider must stay at app root
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
  // CRITICAL: LanguageProvider and AutoLockProvider must wrap the entire app.
  // DO NOT move or remove these — they are permanently anchored here.
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      {/* PERMANENT: LanguageProvider must stay here */}
      <LanguageProvider>
        {/* PERMANENT: AutoLockProvider must stay here */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
