import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ============================================================
// CRITICAL: DO NOT REMOVE LanguageProvider OR AutoLockProvider
// These providers MUST remain in main.tsx and wrap the entire app.
// Removing them will cause white screen / translation failures.
// They are intentionally placed here (not in App.tsx) because
// App.tsx is regenerated during builds but main.tsx is not.
// ============================================================
import ReactDOM from "react-dom/client";
import App from "./App";
// PERMANENT IMPORT -- DO NOT REMOVE
import { AutoLockProvider } from "./contexts/AutoLockContext";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
// PERMANENT IMPORT -- DO NOT REMOVE
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
  // PERMANENT PROVIDERS -- DO NOT REMOVE LanguageProvider or AutoLockProvider
  // These must always wrap the entire app at the root level.
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      {/* PERMANENT -- DO NOT REMOVE */}
      <LanguageProvider>
        {/* PERMANENT -- DO NOT REMOVE */}
        <AutoLockProvider>
          <App />
        </AutoLockProvider>
      </LanguageProvider>
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
