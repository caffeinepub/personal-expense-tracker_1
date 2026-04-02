// ⚠️ CRITICAL: DO NOT REMOVE LanguageProvider or AutoLockProvider from this file.
// They must wrap the entire app to prevent translation failures and crashes.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AutoLockProvider } from "./contexts/AutoLockContext";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
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
  // ⚠️ DO NOT REMOVE LanguageProvider — removing it breaks all translations
  <LanguageProvider>
    {/* ⚠️ DO NOT REMOVE AutoLockProvider — removing it crashes the app */}
    <AutoLockProvider>
      <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
          <App />
        </InternetIdentityProvider>
      </QueryClientProvider>
    </AutoLockProvider>
  </LanguageProvider>,
);
