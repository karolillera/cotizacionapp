const express = require("express");
const router = express.Router();
const db = require("../db");
const { generarPDF } = require("../utils/pdfGenerator");

// ==================================================
// FUNCIÓN PARA GENERAR AAMMCC
// ==================================================
async function generarNumeroCotizacion() {
  const r = await db.query(`
    SELECT COUNT(*) AS total
    FROM cotizaciones
    WHERE fecha >= date_trunc('month', NOW())
      AND fecha < (date_trunc('month', NOW()) + interval '1 month')
  `);

  const consecutivo = Number(r.rows[0].total) + 1;
  const now = new Date();
  const aa = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const cc = String(consecutivo).padStart(2, "0");

  return `${aa}${mm}${cc}`;
}

// ==================================================
// GET /cotizaciones (con filtro opcional ?estado=)
// ==================================================
router.get("/", async (req, res) => {
  const { estado } = req.query;

  try {
    let query = `
      SELECT 
        c.*,
        (
          SELECT COUNT(*) 
          FROM cotizacion_items ci 
          WHERE ci.id_cotizacion = c.id_cotizacion
        ) AS items_count
      FROM cotizaciones c
    `;

    let params = [];

    if (estado) {
      query += " WHERE c.estado = $1";
      params.push(estado);
    }

    query += " ORDER BY c.id_cotizacion DESC";

    const result = await db.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error GET cotizaciones:", err);
    res.status(500).json({ error: "Error al obtener cotizaciones" });
  }
});

// ==================================================
// GET /cotizaciones/:id (una sola cotización + items)
// ==================================================
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const cotQuery = await db.query(
      "SELECT * FROM cotizaciones WHERE id_cotizacion=$1",
      [id]
    );

    if (cotQuery.rowCount === 0) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const itemsQuery = await db.query(
      "SELECT * FROM cotizacion_items WHERE id_cotizacion=$1 ORDER BY item ASC",
      [id]
    );

    res.json({
      ...cotQuery.rows[0],
      items: itemsQuery.rows
    });

  } catch (err) {
    console.error("❌ Error GET cotización por ID:", err);
    res.status(500).json({ error: "Error obteniendo cotización" });
  }
});

// ==================================================
// POST /cotizaciones  (crear nueva)
// ==================================================
router.post("/", async (req, res) => {
  const {
    cliente_nombre, cliente_direccion, cliente_ciudad,
    referencia, subtotal, iva, total,
    porcentaje_admin, porcentaje_utilidad, iva_utilidad,
    nota, estado, items
  } = req.body;

  try {
    await db.query("BEGIN");

    // 🔥 GENERAR NUMERO AAMMCC PARA ESTA COTIZACIÓN
    const numero_cotizacion = await generarNumeroCotizacion();

    const insertCot = `
      INSERT INTO cotizaciones (
        cliente_nombre, cliente_direccion, cliente_ciudad,
        referencia, subtotal, iva, total,
        porcentaje_admin, porcentaje_utilidad, iva_utilidad,
        nota, estado, numero_cotizacion
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id_cotizacion
    `;

    const result = await db.query(insertCot, [
      cliente_nombre, cliente_direccion, cliente_ciudad,
      referencia, subtotal, iva, total,
      porcentaje_admin, porcentaje_utilidad, iva_utilidad,
      nota || null, estado || "borrador",
      numero_cotizacion
    ]);

    const idCot = result.rows[0].id_cotizacion;

    // ==========================
    // Insertar Ítems
    // ==========================
    if (items && items.length > 0) {
      const insertItem = `
      INSERT INTO cotizacion_items (
        id_cotizacion, item, descripcion, unidad, cantidad, valor_unitario
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `;
      for (const it of items) {
        await db.query(insertItem, [
          idCot,
          it.item,
          it.descripcion,
          it.unidad,
          it.cantidad,
          it.valor_unitario,
        ]);
      }
    }

    await db.query("COMMIT");

    res.json({
      success: true,
      id_cotizacion: idCot,
      numero_cotizacion
    });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Error POST cotizaciones:", err);
    res.status(500).json({ error: "Error al crear la cotización" });
  }
});

// ==================================================
// DELETE /cotizaciones/:id
// ==================================================
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM cotizaciones WHERE id_cotizacion=$1", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error DELETE:", err);
    res.status(500).json({ error: "Error al eliminar la cotización" });
  }
});

// ==================================================
// PATCH /cotizaciones/:id/finalizar
// ==================================================
router.patch("/:id/finalizar", async (req, res) => {
  const { id } = req.params;

  try {
    const cot = await db.query(
      "SELECT * FROM cotizaciones WHERE id_cotizacion=$1",
      [id]
    );

    if (cot.rowCount === 0) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    // ⚠️ SI YA TIENE NUMERO, NO LO REGENERO
    let numero = cot.rows[0].numero_cotizacion;
    if (!numero) {
      numero = await generarNumeroCotizacion();
      await db.query(
        `UPDATE cotizaciones 
         SET numero_cotizacion=$1
         WHERE id_cotizacion=$2`,
        [numero, id]
      );
    }

    await db.query(
      `UPDATE cotizaciones 
       SET estado='final'
       WHERE id_cotizacion=$1`,
      [id]
    );

    const pdfPath = await generarPDF(id);

    res.json({
      success: true,
      numero_cotizacion: numero,
      pdf_path: pdfPath
    });

  } catch (err) {
    console.error("❌ Error finalizando:", err);
    res.status(500).json({ error: "Error finalizando la cotización" });
  }
});

// ==================================================
// GET /cotizaciones/:id/pdf
// ==================================================
router.get("/:id/pdf", async (req, res) => {
  try {
    // 1️⃣ GENERAR PDF Y OBTENER RUTA FINAL
    const filePath = await generarPDF(req.params.id);

    // 2️⃣ CONSULTAR LA COTIZACIÓN PARA ARMAR EL NOMBRE
    const { rows } = await db.query(
      "SELECT numero_cotizacion, id_cotizacion, referencia FROM cotizaciones WHERE id_cotizacion=$1",
      [req.params.id]
    );
    const cot = rows[0];

    const nombreArchivo = `${cot.numero_cotizacion || cot.id_cotizacion} - ${cot.referencia}.pdf`
      .replace(/[^\w\s.-]/gi, "_");

    // 3️⃣ DEVOLVER SOLO LA RUTA Y NOMBRE — SIN DESCARGA
    res.json({
      success: true,
      path: filePath,
      nombre: nombreArchivo
    });

  } catch (err) {
    console.error("❌ Error PDF:", err);
    res.status(500).json({ error: "Error al generar PDF" });
  }
});

module.exports = router;







// ==================================================
// PUT /cotizaciones/:id  (editar cotización)
// ==================================================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    cliente_nombre, cliente_direccion, cliente_ciudad,
    referencia, subtotal, iva, total,
    porcentaje_admin, porcentaje_utilidad, iva_utilidad,
    nota, items
  } = req.body;

  try {
    await db.query("BEGIN");

    // Actualizar cabecera
    await db.query(
      `UPDATE cotizaciones SET
        cliente_nombre=$1,
        cliente_direccion=$2,
        cliente_ciudad=$3,
        referencia=$4,
        subtotal=$5,
        iva=$6,
        total=$7,
        porcentaje_admin=$8,
        porcentaje_utilidad=$9,
        iva_utilidad=$10,
        nota=$11
       WHERE id_cotizacion=$12`,
      [
        cliente_nombre,
        cliente_direccion,
        cliente_ciudad,
        referencia,
        subtotal,
        iva,
        total,
        porcentaje_admin,
        porcentaje_utilidad,
        iva_utilidad,
        nota || null,
        id
      ]
    );

    // Borrar ítems actuales
    await db.query(
      "DELETE FROM cotizacion_items WHERE id_cotizacion=$1",
      [id]
    );

    // Insertar ítems nuevos
    const insertItem = `
      INSERT INTO cotizacion_items
      (id_cotizacion, item, descripcion, unidad, cantidad, valor_unitario)
      VALUES ($1,$2,$3,$4,$5,$6)
    `;

    for (const it of items) {
      await db.query(insertItem, [
        id,
        it.item,
        it.descripcion,
        it.unidad,
        it.cantidad,
        it.valor_unitario,
      ]);
    }

    await db.query("COMMIT");

    res.json({ success: true });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Error editando cotización:", err);
    res.status(500).json({ error: "Error editando cotización" });
  }
});