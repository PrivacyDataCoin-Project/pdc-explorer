require("dotenv").config();

let config = {
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  dialect: "postgres",
};

module.exports = {
  development: config,
  test: config,
  production: config
}