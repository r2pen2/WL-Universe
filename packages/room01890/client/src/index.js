import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "./libraries/Web-Legos/assets/style/layout.css";
import "@mantine/core/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { NextUIProvider } from "@nextui-org/react";
import "./assets/style/room01890.css";
import App from "./App";
import { nextUiTheme } from "./assets/style/nextUiTheme";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <MantineProvider theme={createTheme({ fontFamily: "'Wix Madefor Text', Helvetica, Arial, sans-serif" })}>
      <NextUIProvider theme={nextUiTheme}>
        <App />
      </NextUIProvider>
    </MantineProvider>
  </React.StrictMode>
);
