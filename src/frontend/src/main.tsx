import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "./index.css";
import { AutoLockProvider } from "./contexts/AutoLockContext";
// ⚠️ DO NOT REMOVE: LanguageProvider and AutoLockProvider MUST stay here in main.tsx.
// They are intentionally placed here (not App.tsx) so code generation never overwrites them.
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
      {/* ⚠️ DO NOT REMOVE LanguageProvider - required for all translations */}
      <LanguageProvider>
        {/* ⚠️ DO NOT REMOVE AutoLockProvider - required for session security */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
