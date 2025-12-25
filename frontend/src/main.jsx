import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CrearCotizacion from "./pages/CrearCotizacion.jsx";
import RevisarCotizaciones from "./pages/RevisarCotizaciones.jsx";
import VisualizarCotizaciones from "./pages/VisualizarCotizaciones.jsx";
import VerCotizacion from "./pages/VerCotizacion.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* CREAR / EDITAR */}
        <Route path="/crear-cotizacion" element={<CrearCotizacion />} />
        <Route path="/crear-cotizacion/:id" element={<CrearCotizacion />} />

        {/* OTRAS */}
        <Route path="/revisar-cotizaciones" element={<RevisarCotizaciones />} />
        <Route path="/visualizar-cotizaciones" element={<VisualizarCotizaciones />} />
        <Route path="/ver-cotizacion/:id" element={<VerCotizacion />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);