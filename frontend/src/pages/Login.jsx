/**
 * Archivo: Login.jsx
 * Descripción: Vista de inicio de sesión del sistema.
 *              Maneja la validación básica de credenciales
 *              y el control de acceso al dashboard.
 * Autor: Karol Illera
 *
 * NOTA: Este login es de tipo local (hardcodeado).
 *       Se utiliza para entornos internos o de prueba.
 *       No es un sistema de autenticación seguro en producción.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Estilos específicos de la vista
import "./Login.css";

// Logo institucional
import logo from "../assets/logo_seltel_02.png";

export default function Login() {
  const navigate = useNavigate();

  // =======================
  // Estado del formulario
  // =======================
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  /**
   * Maneja el envío del formulario de login
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    const user = formData.username.trim();
    const pass = formData.password;

    // Validación básica de credenciales
    if (user === "admin" && pass === "Seltel123@") {
      // Guarda estado de autenticación en localStorage
      localStorage.setItem("auth", "true");

      // Redirige al dashboard principal
      navigate("/dashboard");
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  // =======================
  // Render principal
  // =======================
  return (
    <div className="login-container">

      <div className="login-card">
        {/* Logo corporativo */}
        <img
          src={logo}
          alt="SELTEL Logo"
          className="login-logo"
        />

        <h1 className="login-title">Iniciar Sesión</h1>
        <p className="login-subtitle">
          Acceso al Sistema de Gestión de Cotizaciones
        </p>

        {/* Formulario de autenticación */}
        <form onSubmit={handleSubmit}>
          <label>Usuario</label>
          <input
            type="text"
            placeholder="Ingrese su usuario"
            value={formData.username}
            onChange={(e) =>
              setFormData({
                ...formData,
                username: e.target.value
              })
            }
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Ingrese su contraseña"
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value
              })
            }
          />

          <button type="submit">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
