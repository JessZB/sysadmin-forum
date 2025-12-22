import { Request, Response, NextFunction } from 'express';
import * as posService from './pos.service';

// Endpoint: GET /api/pos-jobs/terminals
export const getTerminals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('📡 Buscando lista de terminales en MySQL...');

        // Llamamos al servicio
        const terminals = await posService.getAllTerminals();

        // Respondemos al cliente
        res.json({
            success: true,
            count: terminals.length,
            data: terminals
        });

    } catch (error) {
        // Si falla (ej: MySQL apagado), pasamos el error al manejador global
        next(error);
    }
};

// Endpoint: GET /api/pos-jobs/terminals/:id/jobs
export const getJobsByTerminalId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Obtenemos el ID de la URL

        // Convertimos a número porque req.params siempre trae strings
        const terminalId = parseInt(id);

        if (isNaN(terminalId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const jobs = await posService.getTerminalJobs(terminalId);

        res.json({
            success: true,
            terminal_id: terminalId,
            data: jobs
        });
    } catch (error) {
        next(error);
    }
};

// Endpoint: POST /api/pos-jobs/terminals/:id/execute
export const executeJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { jobName } = req.body; // El frontend nos enviará esto en el JSON

        const terminalId = parseInt(id);

        if (isNaN(terminalId)) {
            return res.status(400).json({ error: 'ID de terminal inválido' });
        }
        if (!jobName) {
            return res.status(400).json({ error: 'Se requiere el nombre del job (jobName)' });
        }

        const result = await posService.executeTerminalJob(terminalId, jobName);

        res.json({
            success: true,
            terminal_id: terminalId,
            message: result.message
        });

    } catch (error) {
        next(error);
    }
};