import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
// ⚠️ PERMANENT: AutoLockProvider MUST remain here — do NOT remove or move
import { AutoLockProvider } from "./contexts/AutoLockContext";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
// ⚠️ PERMANENT: LanguageProvider MUST remain here — do NOT remove or move
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
  // ⚠️ PERMANENT PROVIDERS — do NOT remove LanguageProvider or AutoLockProvider
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      {/* ⚠️ PERMANENT: LanguageProvider must wrap entire app */}
      <LanguageProvider>
        {/* ⚠️ PERMANENT: AutoLockProvider must wrap entire app */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
