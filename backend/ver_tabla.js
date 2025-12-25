const db = require("./db");

async function main() {
  const r = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='cotizaciones'");
  console.log(r.rows);
}

main();
