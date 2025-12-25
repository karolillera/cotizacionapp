const express = require("express");
const cors = require("cors");
const app = express();
const cotizacionesRoutes = require("./routes/cotizaciones");
const db = require("./db");

app.use(cors());
app.use(express.json());

// Ruta base para todas las cotizaciones
app.use("/api/cotizaciones", cotizacionesRoutes);

// Prueba rápida
app.get("/", (req, res) => {
  res.send("Servidor SELTEL WebApp corriendo correctamente ✅");
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});