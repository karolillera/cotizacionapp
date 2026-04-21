/**
 * Archivo: ProtectedRoute.jsx
 * Descripción: Componente de protección de rutas.
 *              Restringe el acceso a vistas privadas
 *              verificando el estado de autenticación
 *              almacenado en localStorage.
 * Autor: Karol Illera
 *
 * NOTA:
 * Este mecanismo es una protección básica de frontend.
 * No reemplaza un sistema de autenticación real
 * basado en tokens o sesiones de backend.
 */

import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Verifica si existe sesión activa
  const isAuth = localStorage.getItem("auth");

  // Si no está autenticado, redirige al login
  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  // Si está autenticado, renderiza la ruta protegida
  return children;
}
