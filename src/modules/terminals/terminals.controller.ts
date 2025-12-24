import { Request, Response } from 'express';
import * as terminalService from './terminals.service';

// Vista HTML
export const renderList = (req: Request, res: Response) => {
    res.render('terminals/list', {
        page: 'terminals',
        user: res.locals.user,
        script: 'terminals.client.js'
    });
};

// API JSON (Para Bootstrap Table)
export const getListJson = async (req: Request, res: Response) => {
    try {
        const list = await terminalService.getAllTerminals();
        res.json(list);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

// Create
export const create = async (req: Request, res: Response) => {
    try {
        await terminalService.createTerminal(req.body);
        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
};

// Update
export const update = async (req: Request, res: Response) => {
    try {
        const { forceBlankPassword } = req.body;
        await terminalService.updateTerminal(Number(req.params.id), req.body, forceBlankPassword);
        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
};

// Delete
export const remove = async (req: Request, res: Response) => {
    try {
        await terminalService.deleteTerminal(Number(req.params.id));
        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
};