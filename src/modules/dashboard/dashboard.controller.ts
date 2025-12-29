import { Request, Response } from 'express';
import * as dashService from './dashboard.service';
import { mainDbPool } from '../../shared/db/main.db';

// Renderizar Vista Principal
export const renderDashboard = (req: Request, res: Response) => {
    res.render('dashboard/index', {
        page: 'dashboard',
        user: res.locals.user,
        script: 'dashboard.client.js'
    });
};

export const getTerminalsList = async (req: Request, res: Response) => {
    try {
        const currentUser = res.locals.user;
        const requestedBranch = req.query.branchId ? Number(req.query.branchId) : null;

        let targetBranchId: number | undefined;

        // LÓGICA DE PERMISOS
        if (currentUser.role === 'admin') {
            // El admin puede ver todo (undefined) O filtrar si seleccionó una sucursal en el frontend
            targetBranchId = requestedBranch || undefined;
        } else {
            // El analista ESTÁ FORZADO a ver solo su sucursal
            targetBranchId = currentUser.branch_id;
        }

        const terminals = await dashService.getActiveTerminals(targetBranchId);
        res.json({ success: true, data: terminals });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// API: Obtener lista de Sucursales (Solo para llenar el Select del Admin)
export const getBranchesList = async (req: Request, res: Response) => {
    try {
        // Solo admin puede pedir la lista de sucursales para cambiar vista
        if (res.locals.user.role !== 'admin') {
            return res.json({ success: true, data: [] });
        }

        // Función simple que hace "SELECT id, name FROM sys_branches"
        // Tendrás que crearla en un servicio aparte o importarla
        const [rows] = await mainDbPool.query('SELECT id, name FROM sys_branches WHERE is_active = 1');
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
}
// API: Obtener Jobs
export const getJobs = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { jobs, terminalTime } = await dashService.getTerminalJobs(Number(id));

        // --- CAMBIO AQUÍ ---
        // Enviamos también la hora actual del servidor para cálculos de duración precisos
        res.json({
            success: true,
            data: jobs,
            serverTime: terminalTime // Hora actual del servidor SQL Server (Fuente de Verdad)
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

// API: Detener Job
export const stopJob = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { jobName } = req.body;
        await dashService.stopJob(Number(id), jobName);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// API: Historial Job
export const getHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // ID Terminal
        // El nombre del job puede tener espacios, mejor pasarlo por query param o body. 
        // Aquí usaremos query param: ?name=Job Name
        const jobName = req.query.name as string;

        const history = await dashService.getJobHistory(Number(id), jobName);
        res.json({ success: true, data: history });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};