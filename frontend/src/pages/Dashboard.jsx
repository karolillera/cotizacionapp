/**
 * Archivo: Dashboard.jsx
 * Descripción: Vista principal del sistema de cotizaciones.
 *              Funciona como menú central para acceder
 *              a la creación, revisión y visualización
 *              de cotizaciones.
 * Autor: Karol Illera
 */

import { useNavigate } from "react-router-dom";

// Estilos del dashboard
import "./Dashboard.css";

// Logo institucional
import logoSeltel from "../assets/logo_seltel_02.png";

export default function Dashboard() {
  const navigate = useNavigate();

  /**
   * Cierra la sesión del usuario
   * eliminando el flag de autenticación
   * y redirigiendo al login.
   */
  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/", { replace: true });
  };

  return (
    <div className="dashboard-root">
      {/* =========================
         TOPBAR
      ========================== */}
      <header className="dashboard-header">
        <div className="header-left">
          <img
            src={logoSeltel}
            alt="SELTEL Logo"
            className="header-logo-img"
          />

          <div className="header-subtitle-only">
            Sistema de Gestión de Cotizaciones
          </div>
        </div>

        {/* Información del usuario */}
        <div className="header-right">
          <span className="user-icon">👤</span>
          <span className="user-name">admin</span>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            ⎋ Cerrar Sesión
          </button>
        </div>
      </header>

      {/* =========================
         CONTENIDO PRINCIPAL
      ========================== */}
      <main className="dashboard-content">

        {/* Título */}
        <section className="dashboard-title-section">
          <h1>Menú Principal</h1>
          <p>Seleccione una opción para continuar</p>
        </section>

        {/* Tarjetas de navegación */}
        <section className="dashboard-cards-grid">

          {/* Crear Cotización */}
          <div
            className="dashboard-card"
            onClick={() => navigate("/crear-cotizacion")}
          >
            <div className="card-icon card-icon-green">＋</div>
            <h2>Crear Cotización</h2>
            <p>Crear una nueva cotización para un cliente</p>
          </div>

          {/* Revisar Cotizaciones */}
          <div
            className="dashboard-card"
            onClick={() => navigate("/revisar-cotizaciones")}
          >
            <div className="card-icon card-icon-yellow">📝</div>
            <h2>Revisar Cotizaciones</h2>
            <p>Ver y editar cotizaciones en borrador</p>
          </div>

          {/* Visualizar Cotizaciones */}
          <div
            className="dashboard-card"
            onClick={() => navigate("/visualizar-cotizaciones")}
          >
            <div className="card-icon card-icon-blue">👁</div>
            <h2>Visualizar Cotizaciones</h2>
            <p>Ver todas las cotizaciones registradas</p>
          </div>

        </section>

        {/* Información de contacto */}
        <section className="dashboard-contact">
          <div className="contact-card">
            <h3>Soporte Técnico</h3>

            <p className="contact-name">
              Karol Yelena Illera Alfonso
            </p>
            <p>Ingeniera Electrónica</p>
            <p>📱 322 239 3555</p>
            <p>✉️ karolillera15@hotmail.com</p>
          </div>
        </section>

      </main>
    </div>
  );
}
