import { Request, Response } from 'express';
import * as dashService from './dashboard.service';

// Renderizar Vista Principal
export const renderDashboard = (req: Request, res: Response) => {
    res.render('dashboard/index', {
        page: 'dashboard',
        user: res.locals.user,
        script: 'dashboard.client.js'
    });
};

// API: Obtener lista de cajas (para el sidebar JS)
export const getTerminalsList = async (req: Request, res: Response) => {
    try {
        const terminals = await dashService.getActiveTerminals();
        res.json({ success: true, data: terminals });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// API: Obtener Jobs
// API: Obtener Jobs
export const getJobs = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const jobs = await dashService.getTerminalJobs(Number(id));

        // --- CAMBIO AQUÍ ---
        // Enviamos también la hora actual del servidor para cálculos de duración precisos
        res.json({
            success: true,
            data: jobs,
            serverTime: new Date() // Hora actual del servidor Backend
        });

    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// API: Ejecutar Job
export const runJob = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { jobName } = req.body;
        await dashService.executeJob(Number(id), jobName);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};