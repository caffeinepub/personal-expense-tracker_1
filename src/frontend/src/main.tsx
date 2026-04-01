import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// DO NOT REMOVE: LanguageProvider and AutoLockProvider MUST
// remain permanently at the app root. Removing them causes
// all translations to return raw keys and the app to crash.
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
  // DO NOT REMOVE LanguageProvider or AutoLockProvider from this file
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      {/* PERMANENT: LanguageProvider must wrap the entire app */}
      <LanguageProvider>
        {/* PERMANENT: AutoLockProvider must wrap the entire app */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
