import { Request, Response } from 'express';
import * as branchService from './branches.service';
import * as auditService from '../audit/audit.service';

export const renderList = (req: Request, res: Response) => {
    res.render('branches/list', {
        page: 'branches',
        user: res.locals.user,
        script: 'branches.client.js'
    });
};

export const getData = async (req: Request, res: Response) => {
    try {
        const list = await branchService.getAllBranches();
        res.json(list);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const create = async (req: Request, res: Response) => {
    try {
        const currentUser = res.locals.user;
        const { name } = req.body;

        await branchService.createBranch(req.body, currentUser.id);

        // Auditoría
        auditService.logAction(
            currentUser.id,
            currentUser.branch_id,
            'CREATE',
            'BRANCH',
            null,
            `Sucursal creada: ${name}`,
            req.ip
        );

        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
};

export const update = async (req: Request, res: Response) => {
    try {
        const currentUser = res.locals.user;
        const { name } = req.body;
        const branchId = Number(req.params.id);

        await branchService.updateBranch(branchId, req.body, currentUser.id);

        // Auditoría
        auditService.logAction(
            currentUser.id,
            currentUser.branch_id,
            'UPDATE',
            'BRANCH',
            branchId,
            `Sucursal actualizada: ${name}`,
            req.ip
        );

        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
};

export const remove = async (req: Request, res: Response) => {
    try {
        const currentUser = res.locals.user;
        const branchId = Number(req.params.id);

        await branchService.deleteBranch(branchId);

        // Auditoría
        auditService.logAction(
            currentUser.id,
            currentUser.branch_id,
            'DELETE',
            'BRANCH',
            branchId,
            `Sucursal eliminada ID: ${branchId}`,
            req.ip
        );

        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
};