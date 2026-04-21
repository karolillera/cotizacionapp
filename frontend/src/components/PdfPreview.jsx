/**
 * Archivo: PdfPreview.jsx
 * Descripción: Vista de previsualización de cotizaciones en formato PDF.
 *              Permite mostrar en el navegador el documento generado para
 *              revisión previa, facilitando la validación del contenido
 *              antes de su descarga o uso definitivo.
 * Autor: Karol Illera
 */

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfPreview({ url }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [scale, setScale] = useState(1.2);

  useEffect(() => {
    let cancelled = false;

    async function renderPDF() {
      if (!url || !canvasRef.current) return;

      // cancelar render anterior
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const pdf = await pdfjsLib.getDocument(url).promise;
      if (cancelled) return;

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
      });

      renderTaskRef.current = renderTask;
      await renderTask.promise;
    }

    renderPDF();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [url, scale]);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>-</button>
        <button onClick={() => setScale(s => s + 0.1)}>+</button>
      </div>

      <canvas ref={canvasRef} />
    </div>
  );
}
