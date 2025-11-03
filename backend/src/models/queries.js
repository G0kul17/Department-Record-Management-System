import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Read the SQL from the backup file at runtime so the SQL isn't embedded in a JS
// template literal (that can trigger SQL language-server parsing and red marks).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, "queries.sql.pg");
let sql = "";
try {
  sql = fs.readFileSync(sqlPath, "utf8");
} catch (err) {
  console.error(`Failed to read SQL file at ${sqlPath}:`, err);
}

export default sql;
