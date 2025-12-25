import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "../assets/logo_seltel_02.png";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const user = formData.username.trim();
    const pass = formData.password;

    if (user === "admin" && pass === "Seltel123@") {
      navigate("/dashboard");
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="login-container">

      <div className="login-card">
        <img src={logo} alt="SELTEL Logo" className="login-logo" />

        <h1 className="login-title">Iniciar Sesión</h1>
        <p className="login-subtitle">
          Acceso al Sistema de Gestión de Cotizaciones
        </p>

        <form onSubmit={handleSubmit}>
          <label>Usuario</label>
          <input
            type="text"
            placeholder="Ingrese su usuario"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Ingrese su contraseña"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <button type="submit">Ingresar</button>
        </form>
      </div>
    </div>
  );
}