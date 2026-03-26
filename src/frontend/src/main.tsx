import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "./index.css";
import { AutoLockProvider } from "./contexts/AutoLockContext";
// ⚠️ CRITICAL: LanguageProvider and AutoLockProvider MUST remain here in main.tsx.
// DO NOT remove these providers. They are intentionally placed here (not in App.tsx)
// to prevent translation keys from returning raw strings and to prevent app crash on load.
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
      {/* ⚠️ DO NOT REMOVE LanguageProvider — translations break without it */}
      <LanguageProvider>
        {/* ⚠️ DO NOT REMOVE AutoLockProvider — app crashes without it */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
