import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AutoLockProvider } from "./contexts/AutoLockContext";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
// ⚠️ PERMANENT — DO NOT REMOVE LanguageProvider or AutoLockProvider
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
  // ⚠️ PERMANENT PROVIDERS — DO NOT REMOVE OR REORDER
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      {/* LanguageProvider MUST stay here permanently */}
      <LanguageProvider>
        {/* AutoLockProvider MUST stay here permanently */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
