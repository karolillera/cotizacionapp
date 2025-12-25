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

  const [usarAUI, setUsarAUI] = useState(false);

  const [formData, setFormData] = useState({
    cliente_nombre: "",
    cliente_direccion: "",
    cliente_ciudad: "",
    referencia: "",
    porcentaje_admin: "0",
    porcentaje_utilidad: "0",
    porcentaje_imprevistos: "0",
    nota: "",
  });

  const [items, setItems] = useState([
    {
      item: 1,
      descripcion: "",
      unidad: "",
      cantidad: "0",
      valor_unitario: "0",
      valor_total: 0,
    },
  ]);

  useEffect(() => {
  if (!esEdicion) return;

  useEffect(() => {
    if (!usarAUI) {
      setFormData(prev => ({
        ...prev,
        porcentaje_admin: "0",
        porcentaje_imprevistos: "0",
        porcentaje_utilidad: "0",
      }));
    }
  }, [usarAUI]);

  async function cargarCotizacion() {
    try {
      const data = await getCotizacionById(id);

      // Datos generales
      setFormData({
      cliente_nombre: data.cliente_nombre || "",
        cliente_direccion: data.cliente_direccion || "",
        cliente_ciudad: data.cliente_ciudad || "",
        referencia: data.referencia || "",
        porcentaje_admin: String(data.porcentaje_admin ?? "0"),
        porcentaje_imprevistos: String(data.porcentaje_imprevistos ?? "0"),
        porcentaje_utilidad: String(data.porcentaje_utilidad ?? "0"),
        nota: data.nota || "",
      });

      setUsarAUI(
        Number(data.porcentaje_admin) > 0 ||
        Number(data.porcentaje_utilidad) > 0 ||
        Number(data.porcentaje_imprevistos) > 0
      );

      // Ítems
      const loadedItems = data.items.map((it, idx) => {
        const cant = Number(it.cantidad || 0);
        const vrU = Number(it.valor_unitario || 0);

        return {
          item: it.item ?? idx + 1,
          descripcion: it.descripcion || "",
          unidad: it.unidad || "",
          cantidad: String(cant),
          valor_unitario: String(vrU),
          valor_total: cant * vrU,
        };
      });

      setItems(
        loadedItems.length > 0
          ? loadedItems
          : [{
              item: 1,
              descripcion: "",
              unidad: "",
              cantidad: "0",
              valor_unitario: "0",
              valor_total: 0,
            }]
      );

    } catch (error) {
      console.error("Error cargando cotización:", error);
      alert("No se pudo cargar la cotización para editar");
      navigate("/revisar-cotizaciones");
    }
  }

  cargarCotizacion();
}, [id]);

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
      const cantidad = parseInt(
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
        cantidad: "0",
        valor_unitario: "0",
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

  function calculateTotal() {
    const subtotal = calculateSubtotal();

    // 👉 SIN AUI: solo IVA
    if (!usarAUI) {
      return roundMoney(subtotal * 1.19);
    }

    // 👉 CON AUI
    const pAdmin = parseFloat(formData.porcentaje_admin) || 0;
    const pImp = parseFloat(formData.porcentaje_imprevistos) || 0;
    const pUtil = parseFloat(formData.porcentaje_utilidad) || 0;

    const admin = roundMoney((subtotal * pAdmin) / 100);
    const imprevistos = roundMoney((subtotal * pImp) / 100);
    const utilidad = roundMoney((subtotal * pUtil) / 100);

    const base = subtotal + admin + imprevistos + utilidad;
    const iva = roundMoney(base * 0.19);

    return roundMoney(base + iva);
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
      const payload = {
        ...formData,
        porcentaje_admin: usarAUI ? formData.porcentaje_admin : "0",
        porcentaje_utilidad: usarAUI ? formData.porcentaje_utilidad : "0",
        porcentaje_imprevistos: usarAUI ? formData.porcentaje_imprevistos : "0",
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        iva: roundMoney(calculateTotal() - calculateSubtotal()),
        items,
        estado: "borrador",
      };

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

  return (
    <div className="crear-root">
      {/* ENCABEZADO */}
      <header className="crear-header">
        <button
          type="button"
          className="btn-volver"
          onClick={() => navigate("/dashboard")}
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
              <label htmlFor="cliente_ciudad">Ciudad *</label>
              <input
                id="cliente_ciudad"
                name="cliente_ciudad"
                value={formData.cliente_ciudad}
                onChange={handleInputChange}
                placeholder="Ej: Rivera"
                required
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
                      <select
                        value={it.unidad}
                        onChange={(e) =>
                          handleItemChange(index, "unidad", e.target.value)
                        }
                      >
                        <option value="">Seleccione</option>
                        <option value="Día">Día</option>
                        <option value="Und">Und</option>
                        <option value="Hr">Hr</option>
                        <option value="m">m</option>
                        <option value="m²">m²</option>
                        <option value="Glb">Glb</option>
                      </select>
                    </td>
                    <td className="col-number">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={it.cantidad}
                        onChange={(e) =>
                          handleItemChange(index, "cantidad", e.target.value)
                        }
                      />
                    </td>
                    <td className="col-number">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.valor_unitario}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "valor_unitario",
                            e.target.value
                          )
                        }
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
              <tfoot>
                <tr>
                  <td colSpan={5} className="tfoot-label">
                    Subtotal:
                  </td>
                  <td className="money">{formatCurrency(calculateSubtotal())}</td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={5} className="tfoot-label">
                    Total (con IVA 19%):
                  </td>
                  <td className="money total-blue">
                    {formatCurrency(calculateTotal())}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* OPCIONES ADICIONALES */}
        <section className="crear-card">
        <h2 className="card-title">Opciones Adicionales (AUI)</h2>

        {/* CHECKBOX */}
        <label className="aui-toggle">
          <input
            type="checkbox"
            checked={usarAUI}
            onChange={(e) => setUsarAUI(e.target.checked)}
          />
          Aplicar Administración, Imprevistos y Utilidad (AUI)
        </label>

        {/* CAMPOS SOLO SI AUI ESTÁ ACTIVO */}
        {usarAUI && (
          <div className="card-grid-3">
            <div className="field">
              <label>% Administración</label>
              <input
                type="number"
                name="porcentaje_admin"
                min="0"
                step="0.01"
                value={formData.porcentaje_admin}
                onChange={handleInputChange}
              />
            </div>

            <div className="field">
              <label>% Imprevistos</label>
              <input
                type="number"
                name="porcentaje_imprevistos"
                min="0"
                step="0.01"
                value={formData.porcentaje_imprevistos}
                onChange={handleInputChange}
              />
            </div>

            <div className="field">
              <label>% Utilidad</label>
              <input
                type="number"
                name="porcentaje_utilidad"
                min="0"
                step="0.01"
                value={formData.porcentaje_utilidad}
                onChange={handleInputChange}
              />
            </div>
          </div>
        )}

        <div className="field" style={{ marginTop: 16 }}>
          <label>Notas</label>
          <textarea
            name="nota"
            rows={3}
            value={formData.nota}
            onChange={handleInputChange}
            placeholder="Notas adicionales (opcional)"
          />
        </div>
      </section>

        {/* BOTONES FINALES */}
        <div className="save-row">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate("/dashboard")}
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