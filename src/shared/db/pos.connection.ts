import sql from 'mssql';
import { PosTerminal } from '../interfaces/pos.interface';

/**
 * Crea una configuración de conexión dinámica basada en los datos de la caja.
 */
export const getSqlServerConnection = async (terminal: PosTerminal) => {
    const config: sql.config = {
        user: terminal.db_user,
        password: terminal.db_pass,
        server: terminal.ip_address, // La IP que viene de MySQL
        database: 'msdb',            // Nos conectamos a msdb para ver los jobs
        options: {
            encrypt: false,          // Generalmente false para redes locales/antiguas
            trustServerCertificate: true,
            enableArithAbort: true
        },
        // Timeout corto para que si la caja está apagada no se quede colgado eternamente
        connectionTimeout: 5000 
    };

    try {
        const pool = await new sql.ConnectionPool(config).connect();
        return pool;
    } catch (error) {
        throw new Error(`No se pudo conectar a la caja ${terminal.name} (${terminal.ip_address})`);
    }
};