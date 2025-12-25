import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Download, Search } from "lucide-react";
import { getCotizaciones, downloadPDF } from "../services/api";
import "../pages/VisualizarCotizaciones.css";

export default function VisualizarCotizaciones() {
  const navigate = useNavigate();

  const [cotizaciones, setCotizaciones] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");

  useEffect(() => {
    loadCotizaciones();
  }, []);

  useEffect(() => {
    filtrar();
  }, [searchTerm, estadoFilter, cotizaciones]);

  async function loadCotizaciones() {
    try {
      const data = await getCotizaciones();
      setCotizaciones(data);
      setFiltered(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

    function filtrar() {
      let temp = [...cotizaciones];

      if (estadoFilter !== "todos") {
        temp = temp.filter((c) => c.estado === estadoFilter);
      }

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

  const formatCurrency = (v) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(v);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  if (loading) {
    return (
      <div className="viz-loading">
        <div className="viz-spinner"></div>
        <p>Cargando cotizaciones...</p>
      </div>
    );
  }

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

                  <td className="viz-total">{formatCurrency(c.total)}</td>

                  <td>
                    <span
                      className={
                        c.estado === "final" ? "estado-final" : "estado-borrador"
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
                          navigate(`/ver-cotizacion/${c.id_cotizacion}`)
                        }
                      >
                        <Eye size={14} /> Ver
                      </button>

                      {c.estado === "final" && (
                        <button
                          className="viz-btn"
                          onClick={() => downloadPDF(c.id_cotizacion)}
                        >
                          <Download size={14} /> PDF
                        </button>
                      )}
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