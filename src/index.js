import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { BrowserRouter } from "react-router-dom";
import { AnalyticsProvider } from "src/Utility/Utility.jsx";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <AnalyticsProvider>
      <App /> <br /> <br />
    </AnalyticsProvider>
  </BrowserRouter>
);
