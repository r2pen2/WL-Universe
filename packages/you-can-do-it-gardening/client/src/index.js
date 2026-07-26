import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';
import './assets/style/layout.css';

import { theme, themeLarge } from "./assets/style/theme";

import { NextUIProvider, } from "@nextui-org/react"

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);