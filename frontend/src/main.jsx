/**
 * Archivo: main.jsx
 * Descripción: Punto de entrada de la aplicación React.
 *              Define el enrutamiento principal y protege
 *              las rutas que requieren autenticación.
 * Autor: Karol Illera
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Estilos globales de la aplicación
import "./index.css";

// =======================
// Páginas principales
// =======================
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CrearCotizacion from "./pages/CrearCotizacion.jsx";
import RevisarCotizaciones from "./pages/RevisarCotizaciones.jsx";
import VisualizarCotizaciones from "./pages/VisualizarCotizaciones.jsx";
import VerCotizacion from "./pages/VerCotizacion.jsx";

// =======================
// Componentes de control de acceso
// =======================
// Envuelve las rutas que requieren usuario autenticado
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// =======================
// Renderizado de la aplicación
// =======================
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Habilita el sistema de enrutamiento basado en URL */}
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: acceso al login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard principal (ruta protegida) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Crear nueva cotización */}
        <Route
          path="/crear-cotizacion"
          element={
            <ProtectedRoute>
              <CrearCotizacion />
            </ProtectedRoute>
          }
        />

        {/* Editar cotización existente usando su ID */}
        <Route
          path="/crear-cotizacion/:id"
          element={
            <ProtectedRoute>
              <CrearCotizacion />
            </ProtectedRoute>
          }
        />

        {/* Revisión y gestión de cotizaciones */}
        <Route
          path="/revisar-cotizaciones"
          element={
            <ProtectedRoute>
              <RevisarCotizaciones />
            </ProtectedRoute>
          }
        />

        {/* Vista general de cotizaciones */}
        <Route
          path="/visualizar-cotizaciones"
          element={
            <ProtectedRoute>
              <VisualizarCotizaciones />
            </ProtectedRoute>
          }
        />

        {/* Vista detallada de una cotización específica */}
        <Route
          path="/ver-cotizacion/:id"
          element={
            <ProtectedRoute>
              <VerCotizacion />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
