/**
 * Archivo: CrearCotizacion.jsx
 * Descripción: Vista para la creación y edición de cotizaciones.
 *              Permite registrar datos del cliente, gestionar
 *              ítems dinámicos, aplicar cálculos financieros
 *              (subtotal, AIU, IVA) y guardar o actualizar
 *              cotizaciones en estado borrador.
 * Autor: Karol Illera
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CrearCotizacion.css";
import { createCotizacion, getCotizacionById, updateCotizacion } from "../services/api";

const roundMoney = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

export default function CrearCotizacion() {
  const navigate = useNavigate();

  const { id } = useParams();
  const esEdicion = Boolean(id);

  const [usarAIU, setUsarAIU] = useState(false);

  const [formData, setFormData] = useState({
    cliente_nombre: "",
    cliente_direccion: "",
    cliente_ciudad: "",
    referencia: "",
    porcentaje_admin: "",
    porcentaje_utilidad: "",
    porcentaje_imprevistos: "",
    nota: "",
  });

  const [items, setItems] = useState([
    {
      item: 1,
      descripcion: "",
      unidad: "",
      cantidad: "",
      valor_unitario: "",
      valor_total: 0,
    },
  ]);

useEffect(() => {
  if (!esEdicion) return;

  async function cargarCotizacion() {
    try {
      const data = await getCotizacionById(id);

      setFormData({
        cliente_nombre: data.cliente_nombre || "",
        cliente_direccion: data.cliente_direccion || "",
        cliente_ciudad: data.cliente_ciudad || "",
        referencia: data.referencia || "",
        porcentaje_admin: data.porcentaje_admin != null
          ? String(parseInt(data.porcentaje_admin))
          : "",

        porcentaje_imprevistos: data.porcentaje_imprevistos != null
          ? String(parseInt(data.porcentaje_imprevistos))
          : "",

        porcentaje_utilidad: data.porcentaje_utilidad != null
          ? String(parseInt(data.porcentaje_utilidad))
          : "",

        nota: data.nota || "",
      });

      setUsarAIU(
        Number(data.porcentaje_admin) > 0 ||
        Number(data.porcentaje_utilidad) > 0 ||
        Number(data.porcentaje_imprevistos) > 0
      );

      const loadedItems = data.items.map((it, idx) => {
        const cant = Number(it.cantidad || 0);
        const vrU = Number(it.valor_unitario || 0);

        return {
          item: it.item ?? idx + 1,
          descripcion: it.descripcion || "",
          unidad: it.unidad || "",
          cantidad: String(cant),
          valor_unitario: String(vrU),
          valor_total: roundMoney(cant * vrU),
        };
      });

      setItems(
        loadedItems.length
          ? loadedItems
          : [
              {
                item: 1,
                descripcion: "",
                unidad: "",
                cantidad: "",
                valor_unitario: "",
                valor_total: 0,
              },
            ]
      );
    } catch (err) {
      console.error(err);
      alert("No se pudo cargar la cotización");

      if (esEdicion && id) {
        navigate(`/ver-cotizacion/${id}`);
      } else {
        navigate("/revisar-cotizaciones");
      }
    }
  }

  cargarCotizacion();
}, [id, esEdicion, navigate]);

// 2️⃣ Limpiar porcentajes cuando AIU se apaga
useEffect(() => {
  if (!usarAIU && !esEdicion) {
    setFormData(prev => ({
      ...prev,
      porcentaje_admin: "",
      porcentaje_imprevistos: "",
      porcentaje_utilidad: "",
    }));
  }
}, [usarAIU, esEdicion]);


  // =====================
  // Handlers generales
  // =====================

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleItemChange(index, field, value) {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    if (field === "cantidad" || field === "valor_unitario") {
    const cantidad = parseFloat(
      field === "cantidad" ? value : newItems[index].cantidad
    );
    const vrUnit = parseFloat(
      field === "valor_unitario" ? value : newItems[index].valor_unitario
    );

    const cantNum = isNaN(cantidad) ? 0 : cantidad;
    const vrNum = isNaN(vrUnit) ? 0 : vrUnit;

    newItems[index].valor_total = roundMoney(cantNum * vrNum);
    }

    setItems(newItems);
  }

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        item: prev.length + 1,
        descripcion: "",
        unidad: "",
        cantidad: "",
        valor_unitario: "",
        valor_total: 0,
      },
    ]);
  }

  function handleDeleteItem(index) {
    if (items.length === 1) return;

    const newItems = items.filter((_, i) => i !== index).map((it, idx) => ({
      ...it,
      item: idx + 1,
    }));
    setItems(newItems);
  }

  // =====================
  // Cálculos
  // =====================
  function calculateSubtotal() {
      return roundMoney(
        items.reduce(
          (sum, it) => sum + (Number(it.valor_total) || 0),
          0
        )
      );
    }

    function calculateAIU() {
    const costoSubtotal = calculateSubtotal();

    const adminPct = parseFloat(formData.porcentaje_admin) || 0;
    const impPct = parseFloat(formData.porcentaje_imprevistos) || 0;
    const utilPct = parseFloat(formData.porcentaje_utilidad) || 0;

    const administracion = roundMoney(costoSubtotal * adminPct / 100);
    const imprevistos   = roundMoney(costoSubtotal * impPct / 100);
    const utilidad      = roundMoney(costoSubtotal * utilPct / 100);

    const ivaUtilidad   = roundMoney(utilidad * 0.19);

    const total = roundMoney(
      costoSubtotal +
      administracion +
      imprevistos +
      utilidad +
      ivaUtilidad
    );

    return {
      costoSubtotal,
      administracion,
      imprevistos,
      utilidad,
      ivaUtilidad,
      total
    };
  }

  function calculateTotal() {
    if (!usarAIU) {
      return roundMoney(calculateSubtotal() * 1.19);
    }

    return calculateAIU().total;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value || 0);
  }


  // =====================
  // Submit
  // =====================
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      // =====================
      // Preparar cálculos
      // =====================
      const subtotal = calculateSubtotal();
      const aiu = usarAIU ? calculateAIU() : null;

      // =====================
      // Payload
      // =====================
      const payload = {
        ...formData,

        porcentaje_admin: usarAIU
          ? Number(formData.porcentaje_admin || 0)
          : 0,

        porcentaje_imprevistos: usarAIU
          ? Number(formData.porcentaje_imprevistos || 0)
          : 0,

        porcentaje_utilidad: usarAIU
          ? Number(formData.porcentaje_utilidad || 0)
          : 0,

        subtotal,

        iva: usarAIU
          ? roundMoney(subtotal * 0.19) + aiu.ivaUtilidad
          : roundMoney(subtotal * 0.19),

        total: usarAIU
          ? aiu.total
          : roundMoney(subtotal * 1.19),

        items,
        estado: "borrador",
      };

      // =====================
      // Guardar / Actualizar
      // =====================
      if (esEdicion) {
        await updateCotizacion(id, payload);
        alert("Cotización actualizada correctamente");
        navigate(`/ver-cotizacion/${id}`);
        return;
      }

      const res = await createCotizacion(payload);
      alert("Cotización guardada correctamente");
      navigate(`/ver-cotizacion/${res.id_cotizacion}`);

    } catch (error) {
      console.error(error);
      alert("Error guardando la cotización");
    }
  }

  // =====================
  // Render
  // =====================
  const subtotal = calculateSubtotal();
  const aiu = usarAIU ? calculateAIU() : null;
  const total = usarAIU
    ? aiu.total
    : roundMoney(subtotal * 1.19);

  return (
    <div className="crear-root">
      {/* ENCABEZADO */}
      <header className="crear-header">
        <button
          type="button"
          className="btn-volver"
          onClick={() => 
            navigate(esEdicion ? `/ver-cotizacion/${id}` : "/dashboard")
          }
         >
          ← Volver
        </button>

        <div>
          <h1 className="crear-title">{esEdicion ? "Editar Cotización" : "Crear Cotización"}</h1>
          <p className="crear-subtitle">
            {esEdicion
              ? "Modifique los datos y guarde los cambios"
              : "Complete los datos para generar una nueva cotización"}
          </p>
        </div>
      </header>

      {/* FORMULARIO PRINCIPAL */}
      <form className="crear-form" onSubmit={handleSubmit}>
        {/* DATOS DEL CLIENTE */}
        <section className="crear-card">
          <h2 className="card-title">Datos del Cliente</h2>

          <div className="card-grid-2">
            <div className="field">
              <label htmlFor="cliente_nombre">Nombre del Cliente *</label>
              <input
                id="cliente_nombre"
                name="cliente_nombre"
                value={formData.cliente_nombre}
                onChange={handleInputChange}
                placeholder="Ej: Grupo BIOS"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="cliente_ciudad">Ciudad (Opcional)</label>
              <input
                id="cliente_ciudad"
                name="cliente_ciudad"
                value={formData.cliente_ciudad}
                onChange={handleInputChange}
                placeholder="Ej: Rivera"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="cliente_direccion">Dirección (Opcional)</label>
            <input
              id="cliente_direccion"
              name="cliente_direccion"
              value={formData.cliente_direccion}
              onChange={handleInputChange}
              placeholder="Ej: Calle 10 # 5-20"
            />
          </div>

          <div className="field">
            <label htmlFor="referencia">Referencia / Objeto *</label>
            <input
              id="referencia"
              name="referencia"
              value={formData.referencia}
              onChange={handleInputChange}
              placeholder="Ej: Modificación de ruta de fibra óptica"
              required
            />
          </div>
        </section>

        {/* OPCIONES ADICIONALES */}
        <section className="crear-card">
          <h2 className="card-title">Opciones Adicionales (AIU)</h2>

          <div className="aiu-box">
            <label className="aiu-label">
              <input
                type="checkbox"
                checked={usarAIU}
                onChange={(e) => setUsarAIU(e.target.checked)}
              />
              <span>Aplicar Administración, Imprevistos y Utilidad (AIU)</span>
            </label>
          </div>

          {usarAIU && (
            <div className="card-grid-3">
              <div className="field">
                <label>% Administración</label>
                <input
                  type="number"
                  name="porcentaje_admin"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={formData.porcentaje_admin}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      handleInputChange(e);
                    }
                  }}
                  onWheel={(e) => e.target.blur()}
                  />
              </div>

              <div className="field">
                <label>% Imprevistos</label>
                <input
                  type="number"
                  name="porcentaje_imprevistos"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={formData.porcentaje_imprevistos}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      handleInputChange(e);
                    }
                  }}
                  onWheel={(e) => e.target.blur()}
                  />
              </div>

              <div className="field">
                <label>% Utilidad</label>
                <input
                  type="number"
                  name="porcentaje_utilidad"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={formData.porcentaje_utilidad}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      handleInputChange(e);
                    }
                  }}
                  onWheel={(e) => e.target.blur()}
                  />
              </div>
            </div>
          )}
        </section>

        {/* ÍTEMS */}
        <section className="crear-card">
          <div className="items-header-row">
            <h2 className="card-title">Ítems de la Cotización</h2>
            <button
              type="button"
              className="btn-add-item"
              onClick={handleAddItem}
            >
              + Agregar ítem
            </button>
          </div>

          <div className="table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Descripción</th>
                  <th>Unidad</th>
                  <th>Cantidad</th>
                  <th>Vr Unitario</th>
                  <th>Vr Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, index) => (
                  <tr key={index}>
                    <td className="col-item">{it.item}</td>
                    <td>
                      <input
                        value={it.descripcion}
                        onChange={(e) =>
                          handleItemChange(index, "descripcion", e.target.value)
                        }
                        placeholder="Descripción del ítem"
                      />
                    </td>
                    <td className="col-unidad">
                      <input
                        list={`unidades-${index}`}
                        value={it.unidad || ""}
                        onChange={(e) =>
                          handleItemChange(index, "unidad", e.target.value)
                        }
                        placeholder=""
                        className="unidad-input"
                      />

                      <datalist id={`unidades-${index}`}>
                        <option value="Día" />
                        <option value="Und" />
                        <option value="Hr" />
                        <option value="m" />
                        <option value="m²" />
                        <option value="Glb" />
                      </datalist>
                    </td>

                    <td className="col-number">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={it.cantidad}
                        onChange={(e) =>
                          handleItemChange(index, "cantidad", e.target.value)
                        }
                        onWheel={(e) => e.target.blur()}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                      />
                    </td>

                    <td className="col-number">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.valor_unitario}
                        onChange={(e) =>
                          handleItemChange(index, "valor_unitario", e.target.value)
                        }
                        onWheel={(e) => e.target.blur()} // 🚫 rueda del mouse
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault(); // 🚫 flechas
                          }
                        }}
                      />
                    </td>
                    <td className="money">
                      {formatCurrency(it.valor_total)}
                    </td>
                    <td className="col-delete">
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handleDeleteItem(index)}
                          aria-label="Eliminar ítem"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
                <tfoot className="totales-box">

                  {/* SUBTOTAL */}
                  <tr>
                    <td colSpan={5} style={{ textAlign: "right"}} className="tfoot-label">
                      Subtotal:
                    </td>
                    <td className="money">
                      {formatCurrency(subtotal)}
                    </td>
                    <td />
                  </tr>

                  {/* AIU (solo si aplica) */}
                  {usarAIU && aiu && (
                    <>
                      <tr>
                        <td colSpan={5} style={{ textAlign: "right"}} className="tfoot-label">
                          {formData.porcentaje_admin}% Administración:
                        </td>
                        <td className="money">
                          {formatCurrency(aiu.administracion)}
                        </td>
                        <td />
                      </tr>

                      <tr>
                        <td colSpan={5} style={{ textAlign: "right"}} className="tfoot-label">
                          {formData.porcentaje_imprevistos}% Imprevistos:
                        </td>
                        <td className="money">
                          {formatCurrency(aiu.imprevistos)}
                        </td>
                        <td />
                      </tr>

                      <tr>
                        <td colSpan={5} style={{ textAlign: "right"}} className="tfoot-label">
                          {formData.porcentaje_utilidad}% Utilidad:
                        </td>
                        <td className="money">
                          {formatCurrency(aiu.utilidad)}
                        </td>
                        <td />
                      </tr>

                      <tr>
                        <td colSpan={5} style={{ textAlign: "right"}} className="tfoot-label">
                          IVA (19% Utilidad):
                        </td>
                        <td className="money">
                          {formatCurrency(aiu.ivaUtilidad)}
                        </td>
                        <td />
                      </tr>
                    </>
                  )}

                  {/* IVA normal (solo SIN AIU) */}
                  {!usarAIU && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "right"}} className="tfoot-label">
                        IVA (19%):
                      </td>
                      <td className="money">
                        {formatCurrency(roundMoney(subtotal * 0.19))}
                      </td>
                      <td />
                    </tr>
                  )}

                  {/* TOTAL */}
                  <tr className="total-final">
                    <td colSpan={5} style={{ textAlign: "right"}} className="tfoot-label">
                      TOTAL:
                    </td>
                    <td className="money total-blue">
                      {formatCurrency(total)}
                    </td>
                    <td />
                  </tr>

                </tfoot>
            </table>
          </div>
        </section>

        {/* NOTAS / OBSERVACIONES */}
        <section className="crear-card notas-card">
          <h2 className="card-title">Notas / Observaciones</h2>

          <div className="field">
            <label htmlFor="nota">Notas</label>
            <textarea
              id="nota"
              name="nota"
              rows={4}
              value={formData.nota}
              onChange={handleInputChange}
              placeholder="Observaciones adicionales para la cotización (opcional)"
            />
          </div>
        </section>

        {/* BOTONES FINALES */}
        <div className="save-row">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => 
              navigate(esEdicion ? `/ver-cotizacion/${id}` : "/dashboard")
            }
          >
            Cancelar
          </button>
          <button type="submit" className="btn-save">
            💾 Guardar Cotización
          </button>
        </div>
      </form>
    </div>
  );
}
