import pg from "pg";

async function initdb() {
    const pool = new pg.Pool(
        {
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            host: process.env.PGHOST,
            database: "postgres",
            port: parseInt(process.env.PGPORT || "5432", 10),
            keepAlive: true,
            idleTimeoutMillis: 0,
            max: 100
        }
    );

    try {
        await pool.query(`CREATE DATABASE "${process.env.PGDATABASE}" `);
    } catch (error: any) {
        if (error.code === "42P04") {
            console.log("Database already exists, skipping creation");
        } else {
            throw error;
        }

    }

    await pool.end();
}

export default initdb;