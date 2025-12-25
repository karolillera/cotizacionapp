const fs = require("fs");
const path = require("path");
const PDFKit = require("pdfkit");
const { PDFDocument } = require("pdf-lib");
const db = require("../db");

// =======================
//  Formato DINERO
// =======================
function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}



// =======================
//  WRAPPER DE TEXTO MANUAL (anti-desbordes)
// =======================
function wrapText(doc, text, maxWidth) {
  const words = text.split(" ");
  let lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? currentLine + " " + word : word;
    const width = doc.widthOfString(testLine);

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine.length > 0) lines.push(currentLine);
  return lines;
}



// =======================
//  Generar número AAMMCC
// =======================
async function generarNumero() {
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



// =======================
//  Dibujar encabezado de tabla (SOLO PRIMERA PÁGINA)
// =======================
function drawTableHeader(doc, state, startY) {
  const {
    TABLE_LEFT,
    totalWidth,
    headerHeight,
    xPositions,
    headerTexts,
    col,
  } = state;

  const headerTopY = startY;
  const headerBottomY = headerTopY + headerHeight;

  // Fondo gris encabezado
  doc.save();
  doc.fillColor("#D9D9D9");
  doc.rect(TABLE_LEFT, headerTopY, totalWidth, headerHeight).fill();
  doc.restore();

  doc.strokeColor("#000000");
  doc.lineWidth(0.8);

  // Línea superior
  doc.moveTo(TABLE_LEFT, headerTopY)
    .lineTo(TABLE_LEFT + totalWidth, headerTopY)
    .stroke();

  // Línea inferior encabezado
  doc.moveTo(TABLE_LEFT, headerBottomY)
    .lineTo(TABLE_LEFT + totalWidth, headerBottomY)
    .stroke();

  // Líneas verticales encabezado
  for (let c = 0; c < xPositions.length; c++) {
    doc.moveTo(xPositions[c], headerTopY)
      .lineTo(xPositions[c], headerBottomY)
      .stroke();
  }

  // Texto
  doc.font("Helvetica-Bold").fontSize(9.2);
  for (let c = 0; c < col.length; c++) {
    doc.text(headerTexts[c], xPositions[c], headerTopY + 5, {
      width: col[c],
      align: "center",
    });
  }

  return headerBottomY;
}



// =======================
//  Generar PDF
// =======================
async function generarPDF(idCotizacion) {
  try {
    const cotRes = await db.query(
      "SELECT * FROM cotizaciones WHERE id_cotizacion=$1",
      [idCotizacion]
    );

    const cot = cotRes.rows[0];
    if (!cot) throw new Error("Cotización no existe.");

    const itemsRes = await db.query(
      "SELECT * FROM cotizacion_items WHERE id_cotizacion=$1 ORDER BY item ASC",
      [idCotizacion]
    );
    const items = itemsRes.rows;

    const numero = await generarNumero();

    // Subtotales desde items
    let subtotal = items.reduce(
      (acc, it) => acc + Number(it.cantidad) * Number(it.valor_unitario),
      0
    );
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    // =======================
    // PDF temporal
    // =======================
    const tempPath = path.join(__dirname, `temp_${idCotizacion}.pdf`);
    const tempStream = fs.createWriteStream(tempPath);

    const doc = new PDFKit({ margin: 60, size: "LETTER" });
    doc.pipe(tempStream);

    const CONTENT_LEFT = 80;
    const CONTENT_RIGHT = 530;
    const MAX_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;
    const TABLE_LEFT = 65;

    const PAGE_BOTTOM = 720;
    const CELL_PADDING = 4;

    let y = 120;

    // =======================
    // ENCABEZADO SUPERIOR
    // =======================
    const fecha = new Date(cot.fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.font("Helvetica").fontSize(10).text(`Neiva, ${fecha}`, CONTENT_LEFT, y);

    doc.font("Helvetica-Bold")
      .text(`Cotización No. ${numero}`, CONTENT_LEFT, y, { align: "right" });

    y += 35;

    // =======================
    // CLIENTE
    // =======================
    doc.font("Helvetica").text("Señores", CONTENT_LEFT, y);
    y += 15;

    doc.font("Helvetica-Bold").text(cot.cliente_nombre, CONTENT_LEFT, y);
    y += 15;

    doc.font("Helvetica").text(cot.cliente_direccion || "", CONTENT_LEFT, y);
    y += 15;

    doc.text(cot.cliente_ciudad || "", CONTENT_LEFT, y);
    y += 25;

    doc.font("Helvetica-Bold").text(`Ref: ${cot.referencia}`, CONTENT_LEFT, y);
    y += 30;

    doc.font("Helvetica").text(
      "Estimados señores, de acuerdo a su solicitud presentamos el siguiente presupuesto.",
      CONTENT_LEFT,
      y,
      { width: MAX_WIDTH, align: "justify" }
    );

    y = doc.y + 20;

    // =======================
    // TABLA
    // =======================
    const col = [
      25,  // Item
      280, // Descripción
      30,  // Und
      30,  // Cant
      65,  // Vr Unitario
      65,  // Vr Total
    ];

    const totalWidth = col.reduce((a, b) => a + b, 0);
    const headerHeight = 20;
    const minRowHeight = 14;

    // Construir bodyRows (ítems + totales)
    const bodyRows = [];

    // Ítems
    for (const it of items) {
      const vUnit = Number(it.valor_unitario);
      const vTotal = Number(it.cantidad) * vUnit;

      bodyRows.push({
        kind: "item",
        cells: [
          String(it.item),
          it.descripcion,
          it.unidad,
          String(Math.round(it.cantidad)),
          `$ ${formatMoney(vUnit)}`,
          `$ ${formatMoney(vTotal)}`,
        ],
      });
    }

    // Totales
    bodyRows.push(
      {
        kind: "total",
        cells: ["", "", "", "", "Subtotal", `$  ${formatMoney(subtotal)}`],
      },
      {
        kind: "total",
        cells: ["", "", "", "", "IVA (19%)", `$  ${formatMoney(iva)}`],
      },
      {
        kind: "total",
        cells: ["", "", "", "", "TOTAL", `$  ${formatMoney(total)}`],
      }
    );

    const itemsCount = items.length;
    const totalsCount = 3;
    const totalsStartIndex = itemsCount;

    // Posiciones X
    const xPositions = [TABLE_LEFT];
    for (let i = 0; i < col.length; i++) {
      xPositions.push(xPositions[i] + col[i]);
    }

    const headerTexts = [
      "Item",
      "Descripción",
      "Und",
      "Cant",
      "Vr Unitario",
      "Vr Total",
    ];

    const startXTotals =
      TABLE_LEFT + col[0] + col[1] + col[2] + col[3];

    // =======================
    // PRE-CÁLCULO DE ALTURAS POR FILA
    // =======================
    doc.fontSize(9);

    const rowsMeta = [];

    // Ítems
    for (let r = 0; r < itemsCount; r++) {
        const row = bodyRows[r];
        let maxTextHeight = 0;

        for (let c = 0; c < col.length; c++) {
            const text = row.cells[c] ?? "";
            let align = "left";
            if ([0, 2, 3].includes(c)) align = "center";
            if ([4, 5].includes(c)) align = "right";

            doc.font("Helvetica");
            const cellWidth = col[c] - 2 * CELL_PADDING;
            let textToMeasure = text;

            // **Diferencia clave:** Si es la Descripción (c=1), usamos el texto original
            // para medir la altura con el auto-wrap de PDFKit. Para los demás, usamos el wrap manual.
            if (c !== 1) { 
                const wrappedText = wrapText(doc, text, cellWidth);
                textToMeasure = wrappedText.join("\n");
            }
            
            // Medir altura REAL
            const h = doc.heightOfString(textToMeasure, {
                width: cellWidth,
                align: c === 1 ? 'left' : align, // La descripción siempre alineada a la izquierda para el cálculo
                lineGap: 1
            });

            if (h > maxTextHeight) maxTextHeight = h;
        }

        const rowHeight = Math.max(minRowHeight, maxTextHeight + 4);

        rowsMeta.push({
            kind: "item",
            rowIndex: r,
            rowHeight,
        });
    }

    // Totales
    let totalsHeights = [];
    for (let t = 0; t < totalsCount; t++) {
      const rowIndex = totalsStartIndex + t;
      const row = bodyRows[rowIndex];
      const label = row.cells[4];
      const value = row.cells[5];

      const isBold = label === "Subtotal" || label === "TOTAL";

      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      const labelHeight = doc.heightOfString(label, {
        width: col[4] - 2 * CELL_PADDING,
        align: "center",
      });

      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      const valueHeight = doc.heightOfString(value, {
        width: col[5] - 2 * CELL_PADDING,
        align: "right",
      });

      const rowHeight = Math.max(minRowHeight, labelHeight, valueHeight) + 4;
      totalsHeights.push(rowHeight);

      rowsMeta.push({
        kind: "total",
        rowIndex,
        rowHeight,
        label,
        value,
        isBold,
      });
    }

    const totalBlockHeight = totalsHeights.reduce((a, b) => a + b, 0);

    // =======================
    // DIBUJAR TABLA CON MULTIPÁGINA
    // =======================
    let currentPageHeaderTop = y;

    const state = {
      TABLE_LEFT,
      totalWidth,
      headerHeight,
      xPositions,
      headerTexts,
      col,
    };

    // Dibujar encabezado SOLO en la primera página
    let headerBottomY = drawTableHeader(doc, state, currentPageHeaderTop);
    let currentY = headerBottomY;
    let lastRowKind = null;

    for (let idx = 0; idx < rowsMeta.length; idx++) {
      const meta = rowsMeta[idx];
      let rowHeight = meta.rowHeight;

      // --- 1) SI ENTRAMOS A TOTALES: aseguramos espacio para TODO el bloque ---
      if (meta.kind === "total" && meta.rowIndex === totalsStartIndex) {
        if (currentY + totalBlockHeight > PAGE_BOTTOM) {
          // Cerrar tabla en la página anterior solo si veníamos de ítems
          if (lastRowKind === "item") {
            doc.moveTo(TABLE_LEFT, currentY)
              .lineTo(TABLE_LEFT + totalWidth, currentY)
              .stroke();
          }

          // Salto a nueva página SIN encabezado
          doc.addPage();
          currentY = 140; // posición limpia bajo el membrete
        }
      }

      // --- 2) SALTO DE PÁGINA PARA ÍTEMS ---
      if (meta.kind === "item" && currentY + rowHeight > PAGE_BOTTOM) {
        // Cerrar tabla en la página antes de saltar
        doc.moveTo(TABLE_LEFT, currentY)
          .lineTo(TABLE_LEFT + totalWidth, currentY)
          .stroke();

        doc.addPage();
        currentPageHeaderTop = 120;

        // ⚠️ NO dibujamos encabezado en las siguientes páginas (opción A)
        // Iniciamos directamente las filas de la tabla
        currentY = 140;
      }

      const rowTopY = currentY;

      // ============================
      //      DIBUJAR ÍTEMS
      // ============================
      if (meta.kind === "item") {
        const row = bodyRows[meta.rowIndex];

        // línea superior fila
        doc.moveTo(TABLE_LEFT, rowTopY)
          .lineTo(TABLE_LEFT + totalWidth, rowTopY)
          .stroke();

        // contenido celdas
        for (let c = 0; c < col.length; c++) {
            const text = row.cells[c] ?? "";
            let align = "left";
            // Alineación según la columna
            if ([0, 2, 3].includes(c)) align = "center"; // Item, Und, Cant
            if ([4, 5].includes(c)) align = "right";  // Vr Unitario, Vr Total

            const cellWidth = col[c] - 2 * CELL_PADDING;
            let textToDraw = text;
            let textHeight = 0;

            // --- MANEJO ESPECIAL PARA DESCRIPCIÓN (columna 1) ---
            if (c === 1) {
                
                // Calculamos la altura del texto usando auto-wrap
                textHeight = doc.heightOfString(text, {
                    width: cellWidth,
                    align: 'left',
                    lineGap: 1,
                });

                // 1. Guardar el estado antes del recorte
                doc.save(); 
                
                // 2. Definir el rectángulo de recorte (Clipping)
                // Usamos el ancho total de la columna (col[c]) y la posición de inicio (xPositions[c])
                doc.rect(
                    xPositions[c], 
                    rowTopY, 
                    col[c], 
                    rowHeight
                ).clip(); 

                // 3. Dibujar el texto DENTRO del área recortada
                const cellY = rowTopY + CELL_PADDING; // Alineación al top (arriba)

                doc.font("Helvetica")
                    .fontSize(9)
                    .text(textToDraw, xPositions[c] + CELL_PADDING, cellY, {
                        width: cellWidth, // El texto se auto-ajusta
                        align: 'left',
                        lineGap: 1,
                    });
                    
                // 4. Restaurar el estado (desactivar el recorte)
                doc.restore(); 
                    
            } else {
                // --- MANEJO PARA LAS OTRAS COLUMNAS (Centrado Vertical) ---
                // Se mantiene tu lógica original para obtener el texto y centrar
                const wrappedLines = wrapText(doc, text, cellWidth);
                textToDraw = wrappedLines.join("\n");

                textHeight = doc.heightOfString(textToDraw, {
                    width: cellWidth,
                    align,
                    lineGap: 1,
                });
                
                // Calculamos la posición Y centrada verticalmente
                const cellY = rowTopY + (rowHeight - textHeight) / 2;

                // Dibujar el texto
                doc.font("Helvetica")
                    .fontSize(9)
                    .text(textToDraw, xPositions[c] + CELL_PADDING, cellY, {
                        width: cellWidth,
                        align,
                        lineGap: 1,
                    });
            }

            // línea vertical (Esta línea se dibuja FUERA del clip, para todas las celdas)
            doc.moveTo(xPositions[c], rowTopY)
                .lineTo(xPositions[c], rowTopY + rowHeight)
                .stroke();
        }

        // borde derecho final
        doc.moveTo(xPositions[xPositions.length - 1], rowTopY)
            .lineTo(xPositions[xPositions.length - 1], rowTopY + rowHeight)
            .stroke();
        }



        // ============================
        //         DIBUJAR TOTALES
        // ============================
        else {
            const { label, value, isBold } = meta;
            
            // fondo gris SOLO en TOTAL
            if (label === "TOTAL") {
                doc.save();
                doc.fillColor("#D9D9D9");
                doc.rect(startXTotals, rowTopY, col[4] + col[5], rowHeight).fill();
                doc.restore();
            }

            // Determinar la posición de inicio de la línea horizontal
            let lineStartX = startXTotals;
            
            if (meta.rowIndex === totalsStartIndex) {
                lineStartX = TABLE_LEFT;
            }
            
            // Dibujar la línea horizontal superior
            doc.moveTo(lineStartX, rowTopY)
                .lineTo(TABLE_LEFT + totalWidth, rowTopY)
                .stroke();


            // label (columna 5)
            doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
            const labelHeight = doc.heightOfString(label, {
                width: col[4] - 2 * CELL_PADDING,
                align: "center",
            });
            const labelY = rowTopY + (rowHeight - labelHeight) / 2;

            doc.text(label, startXTotals + CELL_PADDING, labelY, {
                width: col[4] - 2 * CELL_PADDING,
                align: "center",
            });

            // value (columna 6)
            doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
            const valueHeight = doc.heightOfString(value, {
                width: col[5] - 2 * CELL_PADDING,
                align: "right",
            });
            const valueY = rowTopY + (rowHeight - valueHeight) / 2;

            doc.text(value, startXTotals + col[4] + CELL_PADDING, valueY, {
                width: col[5] - 2 * CELL_PADDING,
                align: "right",
            });

            // líneas verticales solo columnas 5 y 6
            for (let c = 4; c < xPositions.length; c++) {
                doc.moveTo(xPositions[c], rowTopY)
                    .lineTo(xPositions[c], rowTopY + rowHeight)
                    .stroke();
            }
        }

        lastRowKind = meta.kind;
        currentY += rowHeight;
    }

    // =========================
    //  LÍNEA FINAL DEFINITIVA
    // =========================
    if (lastRowKind === "item") {
      // si la última fila fuera ítem (caso raro)
      doc.moveTo(TABLE_LEFT, currentY)
        .lineTo(TABLE_LEFT + totalWidth, currentY)
        .stroke();
    } else {
      // normalmente la última fila es TOTAL → cerrar solo debajo de totales
      doc.moveTo(startXTotals, currentY)
        .lineTo(TABLE_LEFT + totalWidth, currentY)
        .stroke();
    }

    y = currentY + 20;

    // =======================
    // FIRMA
    // =======================
    if (y > 620) {
      doc.addPage();
      y = 180;
    }

    doc.font("Helvetica").fontSize(10).text(
      "El precio total incluye tanto la mano de obra, al igual que las actividades, herramientas, accesorios y material necesario para la correcta ejecución de las labores.",
      CONTENT_LEFT,
      y,
      { width: MAX_WIDTH, align: "justify" }
    );

    y += 50;

    doc.text("Atentamente,", CONTENT_LEFT, y);
    y += 60;

    const firmaPath = path.join(__dirname, "../assets/firma_jorge.png");
    if (fs.existsSync(firmaPath)) {
      doc.image(firmaPath, CONTENT_LEFT, y - 10, { width: 150 });
    }

    doc.font("Helvetica-Bold").text(
      "JORGE MEDINA RAMIREZ",
      CONTENT_LEFT,
      y + 50
    );
    doc.font("Helvetica").text("Director Comercial", CONTENT_LEFT);

    doc.end();

    await new Promise((res) => tempStream.on("finish", res));

    // =======================
    // PLANTILLA PDF
    // =======================
    const plantillaPDF = await PDFDocument.load(
      fs.readFileSync(
        path.join(__dirname, "../assets/Plantilla_Seltel_2025.pdf")
      )
    );

    const contenidoPDF = await PDFDocument.load(fs.readFileSync(tempPath));
    const paginasContenido = await contenidoPDF.copyPages(
      contenidoPDF,
      contenidoPDF.getPageIndices()
    );

    const finalDoc = await PDFDocument.create();
    const [plantillaPage] = await finalDoc.copyPages(plantillaPDF, [0]);
    const { width, height } = plantillaPage.getSize();

    for (const pagina of paginasContenido) {
      const page = finalDoc.addPage([width, height]);
      const fondo = await finalDoc.embedPage(plantillaPage);
      const contenido = await finalDoc.embedPage(pagina);

      page.drawPage(fondo, { x: 0, y: 0 });
      page.drawPage(contenido, { x: 0, y: 0 });
    }

    const finalBytes = await finalDoc.save();

    // GUARDAR ARCHIVO FINAL
    const now = new Date();
    const año = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, "0");

    const destino = `Z:/Cotizaciones/PRUEBAS/${año}/${mes}. PRUEBAS/`;
    if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });

    const filePath = path.join(destino, `${numero} ${cot.referencia}.pdf`);
    fs.writeFileSync(filePath, finalBytes);
    fs.unlinkSync(tempPath);

    return filePath;
  } catch (err) {
    console.error("❌ Error en generarPDF:", err);
    throw err;
  }
}

module.exports = { generarPDF };