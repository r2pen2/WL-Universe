import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';


const theme = createTheme();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MantineProvider theme={{
      primaryColor: "cool-green",
      colors: {
        'cool-green': ['#2f4b37', "#3d674e", "#45775a", "#4d8768", "#549472", "#60a483", "#74b496", "#96cab2", "#bdded0", "#e4f2ec"],
      }
    }}
    >
      <Notifications style={{zIndex: 9999, position: 'fixed', top: "1rem", right: "1rem"}}/>
      <App />
    </MantineProvider>
  </React.StrictMode>
);