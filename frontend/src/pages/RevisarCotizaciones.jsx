/**
 * Archivo: RevisarCotizaciones.jsx
 * Descripción: Vista para la revisión de cotizaciones en estado borrador.
 *              Permite visualizar, editar, eliminar y finalizar
 *              cotizaciones antes de su cierre definitivo.
 * Autor: Karol Illera
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Servicios API
import {
  getCotizaciones,
  deleteCotizacion,
  finalizarCotizacion,
} from "../services/api";

// Estilos específicos de la vista
import "./RevisarCotizaciones.css";

export default function RevisarCotizaciones() {
  const navigate = useNavigate();

  // =======================
  // Estados del componente
  // =======================
  const [cotizaciones, setCotizaciones] = useState([]); // cotizaciones en borrador
  const [loading, setLoading] = useState(true);         // estado de carga

  // =======================
  // Carga inicial
  // =======================
  useEffect(() => {
    loadCotizaciones();
  }, []);

  /**
   * Obtiene las cotizaciones en estado "borrador"
   */
  const loadCotizaciones = async () => {
    try {
      const data = await getCotizaciones("borrador");
      setCotizaciones(data);
    } catch (error) {
      console.error("Error cargando cotizaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // Funciones de formato
  // =======================

  // Formato moneda COP
  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);

  // Formato fecha legible
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // =======================
  // Estado de carga
  // =======================
  if (loading) {
    return (
      <div className="rev-loading-screen">
        <div className="rev-spinner"></div>
        <p>Cargando cotizaciones...</p>
      </div>
    );
  }

  // =======================
  // Render principal
  // =======================
  return (
    <div className="rev-root">
      <div className="rev-container">

        {/* ENCABEZADO */}
        <div className="rev-header">
          <button
            className="rev-btn-back"
            onClick={() => navigate("/dashboard")}
          >
            ← Volver
          </button>

          <div>
            <h1 className="rev-title">Revisar Cotizaciones</h1>
            <p className="rev-subtitle">
              Cotizaciones en estado borrador que pueden ser editadas o finalizadas
            </p>
          </div>
        </div>

        {/* ESTADO VACÍO */}
        {cotizaciones.length === 0 ? (
          <div className="empty-card">
            <p className="empty-text">
              No hay cotizaciones en estado borrador
            </p>

            <button
              className="btn-crear-primera"
              onClick={() => navigate("/crear-cotizacion")}
            >
              Crear Primera Cotización
            </button>
          </div>
        ) : (
          /* LISTADO DE COTIZACIONES */
          <div className="rev-list">
            {cotizaciones.map((c) => (
              <div key={c.id_cotizacion} className="rev-card">

                {/* Información principal */}
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

                  {/* Estado y resumen */}
                  <div className="rev-card-right">
                    <span className="rev-status">Borrador</span>
                    <p className="rev-card-total">
                      {formatCurrency(c.total)}
                    </p>
                    <p className="rev-items">
                      {c.items_count} ítems
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="rev-card-actions">
                  <button
                    className="rev-btn-primary"
                    onClick={() =>
                      navigate(`/ver-cotizacion/${c.id_cotizacion}`)
                    }
                  >
                    Ver Cotización
                  </button>

                  <button
                    className="rev-btn-outline"
                    onClick={() =>
                      deleteCotizacion(c.id_cotizacion)
                        .then(loadCotizaciones)
                    }
                  >
                    🗑 Eliminar
                  </button>

                  <button
                    className="rev-btn-green"
                    onClick={async () => {
                      try {
                        await finalizarCotizacion(c.id_cotizacion);
                        alert("Cotización finalizada correctamente");
                        navigate("/visualizar-cotizaciones");
                      } catch (err) {
                        console.error(err);
                        alert("Error finalizando la cotización");
                      }
                    }}
                  >
                    ✔ Finalizar
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
