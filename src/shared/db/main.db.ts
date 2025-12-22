import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Creamos el pool de conexiones (más eficiente que abrir/cerrar)
export const mainDbPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('🔌 Pool de MySQL configurado');