import { Request, Response } from 'express';
import * as userService from './users.service';

export const renderUserList = async (req: Request, res: Response) => {
    try {
        console.log('1. Entrando a renderUserList'); // <--- LOG 1

        const users = await userService.getAllUsers();
        console.log('2. Usuarios obtenidos de BD:', users.length); // <--- LOG 2

        // Verificamos que user y usersData existan
        console.log('3. Intentando renderizar vista users/list');

        res.render('users/list', {
            page: 'users',
            user: res.locals.user,
            usersData: users,
            script: 'users.client.js'
        });

    } catch (error) {
        console.error('ERROR CRÍTICO EN USUARIOS:', error); // <--- LOG DE ERROR
        res.status(500).send('Error cargando usuarios: ' + error);
    }
};

// API: Obtener lista de usuarios en formato JSON para la tabla
export const getUsersData = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        // Bootstrap Table espera un Array directo [{},{}]
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        // 1. VALIDACIÓN DE ROL: Solo admin puede crear
        const currentUser = res.locals.user;
        if (currentUser.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'No tienes permisos para crear usuarios.' });
        }

        const { username, password, role, branch_id } = req.body;
        await userService.createUser({ username, role, branch_id }, password);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        // 1. VALIDACIÓN DE ROL: Solo admin puede editar
        const currentUser = res.locals.user;
        if (currentUser.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'No tienes permisos para editar usuarios.' });
        }

        const { id } = req.params;
        const { username, password, role, branch_id } = req.body;
        await userService.updateUser(Number(id), { username, role, branch_id }, password);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const targetId = Number(id);
        const currentUser = res.locals.user;

        // 1. VALIDACIÓN DE ROL
        if (currentUser.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'No tienes permisos para eliminar usuarios.' });
        }

        // 2. VALIDACIÓN DE AUTO-ELIMINACIÓN
        // Comparamos el ID que viene en la URL con el ID del token de sesión
        if (targetId === currentUser.id) {
            return res.status(400).json({ success: false, error: 'No puedes eliminar tu propio usuario mientras estás conectado.' });
        }

        await userService.deleteUser(targetId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};