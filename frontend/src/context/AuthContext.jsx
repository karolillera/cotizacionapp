/**
 * Archivo: AuthContext.jsx
 * Descripción: Contexto de autenticación de la aplicación.
 *              Actualmente NO se utiliza, ya que la autenticación
 *              se maneja mediante localStorage y ProtectedRoute.
 *
 *              Este archivo queda como base para una futura
 *              implementación de autenticación real
 *              (JWT, backend, roles, expiración, etc.).
 * Autor: Karol Illera
 */

import { createContext } from "react";

// Contexto vacío (placeholder)
const AuthContext = createContext(null);

export default AuthContext;
