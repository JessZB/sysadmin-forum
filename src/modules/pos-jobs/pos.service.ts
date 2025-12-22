import { mainDbPool } from '../../shared/db/main.db';
import { getSqlServerConnection } from '../../shared/db/pos.connection';
import sql from 'mssql';
import { PosTerminal } from '../../shared/interfaces/pos.interface';
import { RowDataPacket } from 'mysql2';

// Función para obtener todas las cajas activas desde MySQL
export const getAllTerminals = async (): Promise<PosTerminal[]> => {
    // 1. Escribimos la consulta SQL
    const query = 'SELECT * FROM pos_terminals WHERE is_active = 1';

    // 2. Ejecutamos la consulta usando el Pool que configuramos antes
    // <RowDataPacket[]> le dice a TS que el resultado es un array de filas
    const [rows] = await mainDbPool.query<RowDataPacket[]>(query);

    // 3. Retornamos los datos casteados a nuestra interfaz PosTerminal
    return rows as PosTerminal[];
};

export const getTerminalJobs = async (terminalId: number) => {
    // 1. Obtener credenciales de MySQL
    const queryTerm = 'SELECT * FROM pos_terminals WHERE id = ? AND is_active = 1';
    const [rows] = await mainDbPool.query<RowDataPacket[]>(queryTerm, [terminalId]);

    if (rows.length === 0) {
        throw new Error('Terminal no encontrada o inactiva');
    }

    const terminal: PosTerminal = rows[0] as PosTerminal;

    // 2. Conectar al SQL Server de esa caja
    let pool: sql.ConnectionPool | null = null;

    try {
        console.log(`🔌 Conectando a ${terminal.name} (${terminal.ip_address})...`);
        pool = await getSqlServerConnection(terminal);

        // 3. Consultar el historial de Jobs (Query estándar de MSDB)
        const result = await pool.request().query(`
            SELECT 
                j.name AS JobName,
                CASE 
                    -- Si hay una actividad iniciada pero no terminada en la sesión actual, está corriendo
                    WHEN ja.start_execution_date IS NOT NULL AND ja.stop_execution_date IS NULL THEN 'En Ejecución'
                    -- Si no, miramos el historial
                    WHEN h.run_status = 1 THEN 'Exitoso'
                    WHEN h.run_status = 0 THEN 'Fallido'
                    WHEN h.run_status = 2 THEN 'Reintentar'
                    WHEN h.run_status = 3 THEN 'Cancelado'
                    ELSE 'Desconocido' 
                END AS LastStatus,
                CASE
                    WHEN ja.start_execution_date IS NOT NULL AND ja.stop_execution_date IS NULL THEN ja.start_execution_date
                    ELSE msdb.dbo.agent_datetime(h.run_date, h.run_time) 
                END AS LastRunDate,
                h.message AS LastMessage
            FROM msdb.dbo.sysjobs j
            -- Join para detectar ejecución en tiempo real
            LEFT JOIN msdb.dbo.sysjobactivity ja 
                ON j.job_id = ja.job_id
                AND ja.session_id = (SELECT TOP 1 session_id FROM msdb.dbo.syssessions ORDER BY session_id DESC)
            -- Join para historial previo
            OUTER APPLY (
                SELECT TOP 1 run_status, run_date, run_time, message
                FROM msdb.dbo.sysjobhistory jh
                WHERE jh.job_id = j.job_id
                ORDER BY run_date DESC, run_time DESC
            ) h
            WHERE j.enabled = 1
        `);
        return result.recordset;

    } catch (error) {
        console.error('Error SQL Server:', error);
        throw error;
    } finally {
        // 4. SIEMPRE cerrar la conexión al terminar
        if (pool) {
            await pool.close();
            console.log(`🔌 Conexión a ${terminal.ip_address} cerrada.`);
        }
    }
};

export const executeTerminalJob = async (terminalId: number, jobName: string) => {
    // 1. Obtener datos de conexión (Reutilizamos lógica)
    // Nota: Podríamos refactorizar esto en una función "getTerminalById" para no repetir código
    const queryTerm = 'SELECT * FROM pos_terminals WHERE id = ? AND is_active = 1';
    const [rows] = await mainDbPool.query<RowDataPacket[]>(queryTerm, [terminalId]);

    if (rows.length === 0) {
        throw new Error('Terminal no encontrada');
    }

    const terminal: PosTerminal = rows[0] as PosTerminal;

    let pool: sql.ConnectionPool | null = null;

    try {
        console.log(`▶ Intentando iniciar job "${jobName}" en ${terminal.name}...`);
        pool = await getSqlServerConnection(terminal);

        // 2. Ejecutar el Stored Procedure del sistema
        // sp_start_job devuelve éxito si logra "encolar" el job, no espera a que termine.
        await pool.request()
            .input('job_name', sql.VarChar, jobName)
            .execute('msdb.dbo.sp_start_job');

        return { message: `Job "${jobName}" iniciado correctamente.` };

    } catch (error: any) {
        // Manejo específico: Si el job ya está corriendo, SQL Server devuelve error 22022
        if (error.originalError && error.originalError.info && error.originalError.info.number === 22022) {
            throw new Error('El job ya está en ejecución actualmente.');
        }
        console.error('Error al ejecutar Job:', error);
        throw error;
    } finally {
        if (pool) await pool.close();
    }
};