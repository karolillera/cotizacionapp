import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { getCotizacionById, finalizarCotizacion, downloadPDF } from "../services/api";
import "./VerCotizacion.css";

export default function VerCotizacion() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [cot, setCot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCotizacion();
  }, []);

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

  async function handleFinalizar() {
    await finalizarCotizacion(id);
    loadCotizacion();
  }

  if (loading) {
    return (
      <div className="ver-loading">
        <div className="spinner"></div>
        <p>Cargando cotización...</p>
      </div>
    );
  }

  if (!cot) {
    return <p>Error: Cotización no encontrada.</p>;
  }

  return (
    <div className="ver-root">
      <div className="ver-container">

        {/* HEADER */}
        <div className="ver-header">
          <button className="ver-btn-back" onClick={() => navigate("/visualizar-cotizaciones")}>
            <ArrowLeft size={18} /> Volver
          </button>

          <div className="ver-header-info">
            <h1 className="ver-title">
              Cotización No. {cot.numero_cotizacion || cot.id_cotizacion}
            </h1>
            <p className="ver-date">{new Date(cot.fecha).toLocaleDateString("es-CO")}</p>
          </div>

          {cot.estado === "final" && (
            <button
              className="ver-download-top"
              onClick={async () => {
                const pdf = await downloadPDF(id);
                const ruta = pdf.path.replace(/\\/g, "/");
                window.open(`file:///${ruta}`);
              }}
            >
              <Download size={16} /> Abrir PDF
            </button>
          )}
        </div>

        {/* BADGE */}
        <div className="ver-badge-container">
          <span className={`ver-badge ${cot.estado === "final" ? "badge-final" : "badge-borrador"}`}>
            {cot.estado === "final" ? "Final" : "Borrador"}
          </span>
        </div>

        {/* CARD: CLIENTE */}
        <div className="ver-card">
          <h2 className="ver-section-title">Datos del Cliente</h2>

          <p><strong>Nombre:</strong> {cot.cliente_nombre}</p>
          <p><strong>Dirección:</strong> {cot.cliente_direccion || "—"}</p>
          <p><strong>Ciudad:</strong> {cot.cliente_ciudad}</p>
          <p><strong>Referencia:</strong> {cot.referencia}</p>
        </div>

        {/* CARD: ITEMS */}
        <div className="ver-card">
          <h2 className="ver-section-title">Ítems de la Cotización</h2>

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
                  <td>{it.item}</td>
                  <td>{it.descripcion}</td>
                  <td>{it.unidad}</td>
                  <td>{Number(it.cantidad).toFixed(0)}</td>
                  <td>${Number(it.valor_unitario).toLocaleString("es-CO")}</td>
                  <td>${Number(it.valor_total).toLocaleString("es-CO")}</td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan="5" className="tfoot-label text-right">Subtotal:</td>
                <td className="tfoot-value">${Number(cot.subtotal).toLocaleString("es-CO")}</td>
              </tr>

              <tr>
                <td colSpan="5" className="tfoot-label text-right">IVA (19%):</td>
                <td className="tfoot-value">${Number(cot.iva).toLocaleString("es-CO")}</td>
              </tr>

              <tr>
                <td colSpan="5" className="tfoot-label total-bold text-right">TOTAL:</td>
                <td className="tfoot-value total-blue">
                  ${Number(cot.total).toLocaleString("es-CO")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Buttons */}
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