import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";

import App from "./App.tsx";
import AuthInitializer from "./components/auth/AuthInitializer";
import { store } from "./store";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <Toaster />
      <AuthInitializer>
        <App />
      </AuthInitializer>
    </Provider>
  </StrictMode>,
);
