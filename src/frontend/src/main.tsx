import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AutoLockProvider } from "./contexts/AutoLockContext";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
// ⚠️ PERMANENT PROVIDERS — DO NOT REMOVE ⚠️
// These providers MUST always wrap the entire app.
// Removing them will cause translation failures and app crashes (white screen).
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
  // ⚠️ DO NOT REMOVE LanguageProvider or AutoLockProvider — see comment above ⚠️
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <LanguageProvider>
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
