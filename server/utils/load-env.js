const path = require("path");
const dotenv = require("dotenv");

const envFiles = [
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "..", "..", ".env"),
];

for (const envPath of envFiles) {
  dotenv.config({ path: envPath, override: false, quiet: true });
}
