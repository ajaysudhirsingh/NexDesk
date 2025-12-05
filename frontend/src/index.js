import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import '@fontsource/inter';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register service worker for PWA functionality (only in production)
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register();
} else {
  console.log('Service worker registration skipped in development mode');
}
