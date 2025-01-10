import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css"; // Aquí importas tus estilos globales
import App from "./App"; // Tu componente principal

// Crear el punto de entrada para renderizar React
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
