/**
 * Archivo: VisualizarCotizaciones.jsx
 * Descripción: Vista de consulta general de cotizaciones.
 *              Permite listar, filtrar y buscar cotizaciones
 *              por estado, cliente, referencia o número.
 * Autor: Karol Illera
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Search } from "lucide-react";

// Estilos específicos de la vista
import "../pages/VisualizarCotizaciones.css";

// Servicios de comunicación con el backend
import { getCotizaciones, API_URL } from "../services/api";

export default function VisualizarCotizaciones() {
  const navigate = useNavigate();

  // =======================
  // Estados del componente
  // =======================
  const [cotizaciones, setCotizaciones] = useState([]); // lista completa
  const [filtered, setFiltered] = useState([]);         // lista filtrada
  const [loading, setLoading] = useState(true);         // estado de carga
  const [searchTerm, setSearchTerm] = useState("");     // texto de búsqueda
  const [estadoFilter, setEstadoFilter] = useState("todos"); // filtro por estado

  // =======================
  // Carga inicial de datos
  // =======================
  useEffect(() => {
    loadCotizaciones();
  }, []);

  // =======================
  // Refiltrado automático
  // =======================
  useEffect(() => {
    filtrar();
  }, [searchTerm, estadoFilter, cotizaciones]);

  /**
   * Obtiene todas las cotizaciones desde el backend
   */
  async function loadCotizaciones() {
    try {
      const data = await getCotizaciones();
      setCotizaciones(data);
      setFiltered(data);
    } catch (e) {
      console.error("Error cargando cotizaciones:", e);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Aplica filtros por estado y texto de búsqueda
   */
  function filtrar() {
    let temp = [...cotizaciones];

    // Filtro por estado
    if (estadoFilter !== "todos") {
      temp = temp.filter((c) => c.estado === estadoFilter);
    }

    // Filtro por texto (número, cliente o referencia)
    if (searchTerm.trim() !== "") {
      temp = temp.filter(
        (c) =>
          String(c.numero_cotizacion || c.id_cotizacion)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          c.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.referencia.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFiltered(temp);
  }

  // =======================
  // Funciones de formato
  // =======================

  // Formato moneda COP
  const formatCurrency = (v) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(v);

  // Formato fecha DD/MM/YYYY
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("es-CO", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  // =======================
  // Estado de carga
  // =======================
  if (loading) {
    return (
      <div className="viz-loading-screen">
        <div className="viz-spinner"></div>
        <p>Cargando cotizaciones...</p>
      </div>
    );
  }

  // =======================
  // Render principal
  // =======================
  return (
    <div className="viz-root">
      {/* HEADER */}
      <div className="viz-header">
        <button className="viz-back" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} /> Volver
        </button>

        <div>
          <h1 className="viz-title">Visualizar Cotizaciones</h1>
          <p className="viz-subtitle">
            Lista completa de todas las cotizaciones registradas
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="viz-filter-card">
        <div className="viz-filter-row">
          <div className="viz-search-box">
            <Search />
            <input
              type="text"
              placeholder="Buscar por número, cliente o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="viz-select"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="final">Final</option>
          </select>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="viz-table-card">
        <h3 className="viz-result-title">
          {filtered.length} cotización{filtered.length !== 1 ? "es" : ""} encontradas
        </h3>

        <div className="viz-table-wrapper">
          <table className="viz-table">
            <thead>
              <tr>
                <th>No. Cotización</th>
                <th>Cliente</th>
                <th>Referencia</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr key={c.id_cotizacion}>
                  <td className="viz-bold">
                    {c.numero_cotizacion || c.id_cotizacion}
                  </td>

                  <td>{c.cliente_nombre}</td>
                  <td className="truncate">{c.referencia}</td>
                  <td>{formatDate(c.fecha)}</td>

                  <td className="viz-total">
                    {formatCurrency(c.total)}
                  </td>

                  <td>
                    <span
                      className={
                        c.estado === "final"
                          ? "estado-final"
                          : "estado-borrador"
                      }
                    >
                      {c.estado === "final" ? "Final" : "Borrador"}
                    </span>
                  </td>

                  <td>
                    <div className="viz-actions">
                      <button
                        className="viz-btn"
                        onClick={() =>
                          window.open(
                            `${API_URL}/cotizaciones/${c.id_cotizacion}/preview`,
                            "_blank"
                          )
                        }
                      >
                        <FileText size={14} /> Ver PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
