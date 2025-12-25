import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCotizaciones,
  deleteCotizacion,
  finalizarCotizacion,
  downloadPDF,
} from "../services/api";
import "./RevisarCotizaciones.css";

export default function RevisarCotizaciones() {
  const navigate = useNavigate();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCotizaciones();
  }, []);

  const loadCotizaciones = async () => {
    try {
      const data = await getCotizaciones("borrador");
      console.log("COTIZACIONES FRONT:", data); //temporal
      setCotizaciones(data);
    } catch (error) {
      console.error("Error cargando cotizaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="rev-loading-screen">
        <div className="rev-spinner"></div>
        <p>Cargando cotizaciones...</p>
      </div>
    );
  }

  return (
    <div className="rev-root">
      <div className="rev-container">
        
        {/* ENCABEZADO */}
        <div className="rev-header">
          <button className="rev-btn-back" onClick={() => navigate("/dashboard")}>
            ← Volver
          </button>

          <div>
            <h1 className="rev-title">Revisar Cotizaciones</h1>
            <p className="rev-subtitle">
              Cotizaciones en estado borrador que pueden ser editadas o finalizadas
            </p>
          </div>
        </div>

        {/* SI NO HAY COTIZACIONES */}
        {cotizaciones.length === 0 ? (
          <div className="empty-card">
            <p className="empty-text">No hay cotizaciones en estado borrador</p>

            <button
              className="btn-crear-primera"
              onClick={() => navigate("/crear-cotizacion")}
            >
              Crear Primera Cotización
            </button>
          </div>
        ) : (
          <div className="rev-list">
            {cotizaciones.map((c) => (
              <div key={c.id_cotizacion} className="rev-card">

                <div className="rev-card-header">
                  <div>
                    <h2 className="rev-card-title">
                      Cotización No. {c.numero_cotizacion || c.id_cotizacion}
                    </h2>

                    <p><b>Cliente:</b> {c.cliente_nombre}</p>
                    <p><b>Ciudad:</b> {c.cliente_ciudad}</p>
                    <p><b>Referencia:</b> {c.referencia}</p>
                    <p><b>Fecha:</b> {formatDate(c.fecha)}</p>
                  </div>

                  <div className="rev-card-right">
                    <span className="rev-status">Borrador</span>
                    <p className="rev-card-total">{formatCurrency(c.total)}</p>
                    <p className="rev-items">{c.items_count} ítems</p>
                  </div>
                </div>

                <div className="rev-card-actions">
                  <button
                    className="rev-btn-outline"
                    onClick={() => navigate(`/ver-cotizacion/${c.id_cotizacion}`)}
                  >
                    👁 Ver Detalle
                  </button>

                  <button
                    className="rev-btn-delete"
                    onClick={() =>
                      deleteCotizacion(c.id_cotizacion).then(loadCotizaciones)
                    }
                  >
                    🗑 Eliminar
                  </button>

                  <button
                    className="rev-btn-green"
                    onClick={() =>
                      finalizarCotizacion(c.id_cotizacion)
                        .then(() => downloadPDF(c.id_cotizacion))
                        .then(loadCotizaciones)
                    }
                  >
                    ✔ Finalizar y Generar PDF
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}