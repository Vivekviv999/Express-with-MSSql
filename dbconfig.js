const sql = require("mssql");

const config = {
  user: "sa", // Replace with your SQL Server username
  password: "12345", // Replace with your SQL Server password
  server: "LAPTOP-L3HLC3G5", // Replace with your SQL Server instance (e.g., localhost)
  database: "userdb", // Replace with your database name
  port: 1433, // Default SQL Server port
  options: {
    encrypt: true, // Use true if connecting to Azure SQL
    trustServerCertificate: true, // Required for self-signed certificates
  },
};

const connectToDatabase = async () => {
  try {
    const pool = await sql.connect(config);
    console.log("Connected to MSSQL Database!");
    return pool;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

module.exports = { connectToDatabase, sql };
