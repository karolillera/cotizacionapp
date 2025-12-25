import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import logoSeltel from "../assets/logo_seltel_02.png";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="dashboard-root">
      {/* TOPBAR */}
      <header className="dashboard-header">
        <div className="header-left">
          <img src={logoSeltel} alt="SELTEL Logo" className="header-logo-img" />

          <div className="header-subtitle-only">
            Sistema de Gestión de Cotizaciones
          </div>
        </div>

        <div className="header-right">
          <span className="user-icon">👤</span>
          <span className="user-name">admin</span>
          <button className="logout-button" onClick={handleLogout}>
            ⎋ Cerrar Sesión
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="dashboard-content">
        <section className="dashboard-title-section">
          <h1>Menú Principal</h1>
          <p>Seleccione una opción para continuar</p>
        </section>

        <section className="dashboard-cards-grid">
          <div
            className="dashboard-card"
            onClick={() => navigate("/crear-cotizacion")}
          >
            <div className="card-icon card-icon-green">＋</div>
            <h2>Crear Cotización</h2>
            <p>Crear una nueva cotización para un cliente</p>
          </div>

          <div
            className="dashboard-card"
            onClick={() => navigate("/revisar-cotizaciones")}
          >
            <div className="card-icon card-icon-yellow">📝</div>
            <h2>Revisar Cotizaciones</h2>
            <p>Ver y editar cotizaciones en borrador</p>
          </div>

          <div
            className="dashboard-card"
            onClick={() => navigate("/visualizar-cotizaciones")}
          >
            <div className="card-icon card-icon-blue">👁</div>
            <h2>Visualizar Cotizaciones</h2>
            <p>Ver todas las cotizaciones registradas</p>
          </div>
        </section>

        <section className="dashboard-contact">
          <div className="contact-card">
            <h3>Información de Contacto</h3>
            <p>Calle 12 # 5-07 Ofc. 202</p>
            <p>Tel. 8645011 – Cel. 316 781 4955</p>
            <p>Neiva – Huila</p>
          </div>
        </section>
      </main>
    </div>
  );
}