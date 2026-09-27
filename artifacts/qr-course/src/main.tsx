import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import { setAiProviderGetter } from "@workspace/api-client-react";

setAiProviderGetter(() => localStorage.getItem("economics101-ai-provider") || "perplexity");

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
