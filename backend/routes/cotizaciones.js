/**
 * Archivo: cotizaciones.js
 * Descripción: Define las rutas y la lógica del backend para la gestión
 *              de cotizaciones. Permite crear, consultar, actualizar,
 *              eliminar, finalizar cotizaciones y generar o previsualizar
 *              sus documentos PDF asociados.
 * Autor: Karol Illera
 */

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
    referencia,
    porcentaje_admin, porcentaje_imprevistos, porcentaje_utilidad,
    nota, estado, items
  } = req.body;

  console.log("📥 Payload recibido en POST /cotizaciones:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    await db.query("BEGIN");

    // =========================
    // CALCULAR TOTALES EN BACKEND
    // =========================
    const subtotal = items.reduce(
      (acc, it) => acc + Number(it.cantidad) * Number(it.valor_unitario),
      0
    );

    const pAdmin = Number(porcentaje_admin || 0);
    const pImp   = Number(porcentaje_imprevistos || 0);
    const pUtil  = Number(porcentaje_utilidad || 0);

    const usarAIU = pAdmin > 0 || pImp > 0 || pUtil > 0;

    const valor_admin       = usarAIU ? subtotal * pAdmin / 100 : 0;
    const valor_imprevistos = usarAIU ? subtotal * pImp / 100 : 0;
    const valor_utilidad    = usarAIU ? subtotal * pUtil / 100 : 0;

    const valor_iva = usarAIU
      ? valor_utilidad * 0.19
      : subtotal * 0.19;

    let total;

    if (usarAIU) {
      total =
        subtotal +
        valor_admin +
        valor_imprevistos +
        valor_utilidad +
        valor_iva;
    } else {
      total = subtotal + valor_iva;
    }

    const numero_cotizacion = await generarNumeroCotizacion();

    const insertCot = `
    INSERT INTO cotizaciones (
      cliente_nombre, cliente_direccion, cliente_ciudad,
      referencia,
      subtotal,
      valor_admin,
      valor_imprevistos,
      valor_utilidad,
      valor_iva,
      total,
      porcentaje_admin,
      porcentaje_imprevistos,
      porcentaje_utilidad,
      nota,
      estado,
      numero_cotizacion
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING id_cotizacion
    `;

    const result = await db.query(insertCot, [
      cliente_nombre,
      cliente_direccion,
      cliente_ciudad,
      referencia,
      subtotal,
      valor_admin,
      valor_imprevistos,
      valor_utilidad,
      valor_iva,
      total,
      pAdmin,
      pImp,
      pUtil,
      nota || null,
      estado || "borrador",
      numero_cotizacion
    ]);

    const idCot = result.rows[0].id_cotizacion;

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

    const pdfPath = await generarPDF(id, { force:true});

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
const path = require("path");

router.get("/:id/pdf", async (req, res) => {
  try {
    const filePath = await generarPDF(req.params.id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path.basename(filePath)}"`
    );

    return res.sendFile(filePath);

  } catch (err) {
    console.error("❌ Error PDF:", err);
    res.status(500).json({ error: "Error mostrando PDF" });
  }
});


// ==================================================
// GET /cotizaciones/:id/preview   (vista tipo Canva)
// ==================================================
router.get("/:id/preview", async (req, res) => {
  try {
    const { id } = req.params;

    // 1) Buscar cotización
    const r = await db.query(
      "SELECT id_cotizacion, numero_cotizacion, referencia FROM cotizaciones WHERE id_cotizacion=$1",
      [id]
    );

    if (r.rowCount === 0) {
      return res.status(404).send("Cotización no encontrada");
    }

    let cot = r.rows[0];

    // 2) Si NO tiene número, generarlo y guardarlo (también en borrador)
    if (!cot.numero_cotizacion) {
      const nuevoNumero = await generarNumeroCotizacion();

      await db.query(
        "UPDATE cotizaciones SET numero_cotizacion=$1 WHERE id_cotizacion=$2",
        [nuevoNumero, id]
      );

      cot.numero_cotizacion = nuevoNumero;
    }

    // 3) Generar PDF (force para que siempre actualice el borrador)
    const filePath = await generarPDF(id, { force: true });

    const referenciaLimpia = (cot.referencia || "SIN_REFERENCIA")
      .replace(/[<>:"/\\|?*]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${cot.numero_cotizacion} ${referenciaLimpia}.pdf"`
    );

    return res.sendFile(filePath);

  } catch (err) {
    console.error("❌ Error preview PDF:", err);
    res.status(500).send("Error mostrando PDF");
  }
});


// ==================================================
// PUT /cotizaciones/:id
// yyy  (editar cotización)
// ==================================================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    cliente_nombre, cliente_direccion, cliente_ciudad,
    referencia, 
    porcentaje_admin, porcentaje_imprevistos, porcentaje_utilidad, iva_utilidad,
    nota, items
  } = req.body;

  try {
    await db.query("BEGIN");

    const subtotal = items.reduce(
      (acc, it) => acc + Number(it.cantidad) * Number(it.valor_unitario),
      0
    );

    const pAdmin = Number(porcentaje_admin || 0);
    const pImp   = Number(porcentaje_imprevistos || 0);
    const pUtil  = Number(porcentaje_utilidad || 0);

    const usarAIU = pAdmin > 0 || pImp > 0 || pUtil > 0;

    const valor_admin       = usarAIU ? subtotal * pAdmin / 100 : 0;
    const valor_imprevistos = usarAIU ? subtotal * pImp / 100 : 0;
    const valor_utilidad    = usarAIU ? subtotal * pUtil / 100 : 0;

    const valor_iva = usarAIU
      ? valor_utilidad * 0.19
      : subtotal * 0.19;

    let total;

    if (usarAIU) {

      total =
        subtotal +
        valor_admin +
        valor_imprevistos +
        valor_utilidad +
        valor_iva; // IVA sobre utilidad
    } else {
      total = subtotal + valor_iva;
    }


    // Actualizar cabecera
    await db.query(`
      UPDATE cotizaciones SET
        cliente_nombre=$1,
        cliente_direccion=$2,
        cliente_ciudad=$3,
        referencia=$4,
        subtotal=$5,
        valor_admin=$6,
        valor_imprevistos=$7,
        valor_utilidad=$8,
        valor_iva=$9,
        total=$10,
        porcentaje_admin=$11,
        porcentaje_imprevistos=$12,
        porcentaje_utilidad=$13,
        nota=$14
      WHERE id_cotizacion=$15
    `, [
      cliente_nombre,
      cliente_direccion,
      cliente_ciudad,
      referencia,
      subtotal,
      valor_admin,
      valor_imprevistos,
      valor_utilidad,
      valor_iva,
      total,
      pAdmin,
      pImp,
      pUtil,
      nota || null,
      id
    ]);

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

module.exports = router;
