require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,       // postgres
  port: process.env.DB_PORT,       // 5432
  user: process.env.DB_USER,       // seltel
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,   // webapp_seltel
});

pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL (webapp_seltel)"))
  .catch(err => console.error("❌ Error de conexión:", err));

module.exports = pool;
