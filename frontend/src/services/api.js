
export const API_URL = `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_PATH}`;


// =======================================
//            COTIZACIONES
// =======================================

// Obtener cotizaciones:
// - estado = "borrador" → trae borradores
// - estado = "final"    → trae finalizadas
// - estado = null       → trae TODAS
export async function getCotizaciones(estado = null) {
  const url = estado
    ? `${API_URL}/cotizaciones?estado=${estado}`
    : `${API_URL}/cotizaciones`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Error obteniendo cotizaciones");
  return await res.json();
}

// Crear nueva cotización
export async function createCotizacion(data) {
  const res = await fetch(`${API_URL}/cotizaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error("Error creando cotización");
  return await res.json();
}

// Eliminar cotización
export async function deleteCotizacion(id) {
  const res = await fetch(`${API_URL}/cotizaciones/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) throw new Error("Error eliminando cotización");
  return await res.json();
}

// Finalizar cotización (genera número y PDF)
export async function finalizarCotizacion(id) {
  const res = await fetch(`${API_URL}/cotizaciones/${id}/finalizar`, {
    method: "PATCH"
  });

  if (!res.ok) throw new Error("Error finalizando cotización");
  return await res.json();  // incluye numero y pdf_path
}

// Obtener PDF (NO descarga nada aquí)
export async function downloadPDF(id) {
  const res = await fetch(`${API_URL}/cotizaciones/${id}/preview`);
  if (!res.ok) throw new Error("Error obteniendo PDF");

  // Backend retorna { path, nombre }
  const data = await res.json();
  return data;
}

// Obtener cotización por ID
export async function getCotizacionById(id) {
  const res = await fetch(`${API_URL}/cotizaciones/${id}`);
  if (!res.ok) throw new Error("Error obteniendo cotización por ID");
  return await res.json();
}



// Editar cotización
export async function updateCotizacion(id, data) {
  const res = await fetch(`${API_URL}/cotizaciones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error("Error actualizando cotización");
  return await res.json();
}
