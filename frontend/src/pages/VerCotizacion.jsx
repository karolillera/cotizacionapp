/**
 * Archivo: VerCotizacion.jsx
 * Descripción: Vista de detalle de una cotización.
 *              Permite visualizar información del cliente,
 *              ítems, cálculos financieros (subtotal, AUI, IVA),
 *              descargar el PDF y finalizar la cotización.
 * Autor: Karol Illera
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";

// Servicios API
import { getCotizacionById, finalizarCotizacion, API_URL } from "../services/api";

// Estilos específicos de la vista
import "./VerCotizacion.css";

export default function VerCotizacion() {
  const navigate = useNavigate();
  const { id } = useParams(); // ID de la cotización desde la URL

  // =======================
  // Estados del componente
  // =======================
  const [cot, setCot] = useState(null);     // Cotización cargada
  const [loading, setLoading] = useState(true); // Estado de carga

  // =======================
  // Carga inicial de datos
  // =======================
  useEffect(() => {
    loadCotizacion();
  }, []);

  /**
   * Obtiene la cotización desde el backend usando el ID
   */
  async function loadCotizacion() {
    try {
      const data = await getCotizacionById(id);
      setCot(data);
    } catch (err) {
      console.error("Error cargando cotización:", err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Finaliza la cotización:
   * - Cambia estado a "final"
   * - Genera número de cotización
   * - Genera el PDF
   */
  async function handleFinalizar() {
    try {
      await finalizarCotizacion(id);
      alert("Cotización finalizada correctamente");
      navigate("/visualizar-cotizaciones");
    } catch (err) {
      console.error(err);
      alert("Error finalizando la cotización");
    }
  }

  // =======================
  // Estados de carga / error
  // =======================
  if (loading) {
    return (
      <div className="ver-loading-screen">
        <div className="ver-spinner"></div>
        <p>Cargando cotización...</p>
      </div>
    );
  }

  if (!cot) {
    return <p>Error: Cotización no encontrada.</p>;
  }

  // =======================
  // Cálculos financieros
  // =======================

  // Redondeo estándar para valores monetarios
  const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  
  // Subtotal a partir de los ítems
  const subtotal = cot.items.reduce(
    (acc, it) => acc + Number(it.cantidad) * Number(it.valor_unitario),
    0
  );

  // Porcentajes AUI
  const pAdmin = Number(cot.porcentaje_admin || 0);
  const pImp   = Number(cot.porcentaje_imprevistos || 0);
  const pUtil  = Number(cot.porcentaje_utilidad || 0);

  // Determina si aplica esquema AUI
  const usaAUI = pAdmin > 0 || pImp > 0 || pUtil > 0;

  // Valores AUI
  const admin        = roundMoney(subtotal * pAdmin / 100);
  const imprevistos  = roundMoney(subtotal * pImp / 100);
  const utilidad     = roundMoney(subtotal * pUtil / 100);

  // IVA sobre utilidad
  const ivaUtilidad = roundMoney(utilidad * 0.19);

  // Total final
  const total = roundMoney(
    subtotal * 1.19 +
    admin +
    imprevistos +
    utilidad +
    ivaUtilidad
  );

  // =======================
  // Render principal
  // =======================
  return (
    <div className="ver-root">
      <div className="ver-container">

        {/* HEADER */}
        <div className="ver-header">
          <div className="ver-header-left">
            <button
              className="ver-btn-back"
              onClick={() => navigate("/revisar-cotizaciones")}
            >
              <ArrowLeft size={18} /> Volver
            </button>

            <div className="ver-header-info">
              <h1 className="ver-title">
                Cotización No. {cot.numero_cotizacion || cot.id_cotizacion}
              </h1>
              <p className="ver-date">
                {new Date(cot.fecha).toLocaleDateString("es-CO", { timeZone: "UTC" })}
              </p>
            </div>
          </div>

          {/* ACCIONES HEADER (solo en borrador) */}
          {cot.estado === "borrador" && (
            <div className="ver-header-actions">
              <button
                className="ver-download-top"
                onClick={() =>
                  window.open(
                    `${API_URL}/cotizaciones/${cot.id_cotizacion}/preview`,
                    "_blank"
                  )
                }
              >
                <Download size={16} /> Ver PDF
              </button>
            </div>
          )}
        </div>

        {/* BADGE DE ESTADO */}
        <div className="ver-badge-container">
          <span
            className={`ver-badge ${
              cot.estado === "final" ? "badge-final" : "badge-borrador"
            }`}
          >
            {cot.estado === "final" ? "Final" : "Borrador"}
          </span>
        </div>

        {/* DATOS DEL CLIENTE */}
        <div className="ver-card">
          <h2 className="ver-section-title">Datos del Cliente</h2>
          <p><strong>Nombre:</strong> {cot.cliente_nombre}</p>
          <p><strong>Dirección:</strong> {cot.cliente_direccion || "—"}</p>
          <p><strong>Ciudad:</strong> {cot.cliente_ciudad}</p>
          <p><strong>Referencia:</strong> {cot.referencia}</p>
        </div>

        {/* ÍTEMS DE LA COTIZACIÓN */}
        <div className="ver-card">
          <h2 className="ver-section-title">Ítems de la Cotización</h2>

          <div className="table-container">
            <table className="ver-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Descripción</th>
                  <th>Und</th>
                  <th>Cant</th>
                  <th>Vr Unitario</th>
                  <th>Vr Total</th>
                </tr>
              </thead>

              <tbody>
                {cot.items?.map((it) => (
                  <tr key={it.item}>
                    <td>
                      {it.item}
                    </td>
                    <td>
                      {it.descripcion}
                      </td>
                    <td>
                      {it.unidad}
                      </td>
                    <td>
                      {Number(it.cantidad).toFixed(0)}
                      </td>
                    <td>
                      ${Number(it.valor_unitario).toLocaleString("es-CO")}
                    </td>
                    <td className="money">
                      ${Number(it.valor_total).toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="totales-box">
                <tr>
                  <td colSpan="5" style={{ textAlign: "right"}} className="tfoot-label">
                    Subtotal:
                  </td>
                  <td className="money">
                    ${subtotal.toLocaleString("es-CO")}
                  </td>
                </tr>

                {/* AIU (solo si aplica) */}
                {usaAUI && (
                  <>
                    {pAdmin > 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "right"}} className="tfoot-label">
                          Administración ({pAdmin}%):
                        </td>
                        <td className="money">
                          ${admin.toLocaleString("es-CO")}
                        </td>
                      </tr>
                    )}

                    {pImp > 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "right"}} className="tfoot-label">
                          Imprevistos ({pImp}%):
                        </td>
                        <td className="money">
                          ${imprevistos.toLocaleString("es-CO")}
                        </td>
                      </tr>
                    )}

                    {pUtil > 0 && (
                      <>
                        <tr>
                          <td colSpan="5" style={{ textAlign: "right"}} className="tfoot-label">
                            Utilidad ({pUtil}%):
                          </td>
                          <td className="money">
                            ${utilidad.toLocaleString("es-CO")}
                          </td>
                        </tr>

                        <tr>
                          <td colSpan="5" style={{ textAlign: "right"}} className="tfoot-label">
                            IVA Utilidad (19%):
                          </td>
                          <td className="money">
                            ${ivaUtilidad.toLocaleString("es-CO")}
                          </td>
                        </tr>
                      </>
                    )}
                  </>
                )}

                {/* IVA normal (solo SIN AIU) */}
                {!usaAUI && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "right"}} className="tfoot-label">
                      IVA (19%):
                    </td>
                    <td className="money">
                      ${roundMoney(subtotal * 0.19).toLocaleString("es-CO")}
                    </td>
                  </tr>
                )}

                {/* TOTAL */}
                <tr className="total-final">
                  <td colSpan="5" style={{ textAlign: "right"}} className="tfoot-label">
                    TOTAL:
                  </td>
                  <td className="money total-blue">
                    ${total.toLocaleString("es-CO")}
                  </td>
                </tr>
              
              </tfoot>
            </table>
          </div>
        </div>

        {/* NOTAS / OBSERVACIONES */}
        {cot.nota && (
          <div className="ver-card">
            <h2 className="ver-section-title">Notas / Observaciones</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{cot.nota}</p>
          </div>
        )}

        {/* BOTONES SOLO PARA BORRADOR */}
        {cot.estado === "borrador" && (
          <div className="ver-buttons">
            <button
              className="btn-editar"
              onClick={() =>
                navigate(`/crear-cotizacion/${cot.id_cotizacion}`)
              }
            >
              ✏️ Editar Cotización
            </button>

            <button
              className="btn-finalizar"
              onClick={handleFinalizar}
            >
              ✔ Finalizar Cotización
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
