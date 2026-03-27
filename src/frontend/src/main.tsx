import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "./index.css";
import { AutoLockProvider } from "./contexts/AutoLockContext";
// === DO NOT REMOVE: LanguageProvider and AutoLockProvider must stay here permanently ===
import { LanguageProvider } from "./i18n/LanguageContext";
// === END DO NOT REMOVE ===

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
      {/* === DO NOT REMOVE: LanguageProvider and AutoLockProvider must stay here permanently === */}
      <LanguageProvider>
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
      {/* === END DO NOT REMOVE === */}
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
