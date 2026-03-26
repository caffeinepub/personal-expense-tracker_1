import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// DO NOT REMOVE: LanguageProvider and AutoLockProvider must stay here permanently
// These providers are required for translations and session security to work throughout the app.
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
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      {/* DO NOT REMOVE: LanguageProvider must wrap everything for translations to work */}
      <LanguageProvider>
        {/* DO NOT REMOVE: AutoLockProvider must be inside LanguageProvider */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
