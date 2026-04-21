require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false, // cámbialo solo si usas SSL
});

// 🔍 Verificación REAL de conexión
(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL conectado:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Error conectando a PostgreSQL:", err.message);
  }
})();

module.exports = pool;
