import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';
import './libraries/Web-Legos/assets/style/layout.css';

import { nextUiTheme } from "./assets/style/nextUiTheme";

import { NextUIProvider, } from "@nextui-org/react"

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* <NextUIProvider theme={nextUiTheme}> */}
      <App />
    {/* </NextUIProvider> */}
  </React.StrictMode>
);