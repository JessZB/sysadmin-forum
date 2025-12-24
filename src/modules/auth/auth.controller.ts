import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mainDbPool } from '../../shared/db/main.db';
import { RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// GET: Muestra el formulario (Este SÍ renderiza vista)
export const showLogin = (req: Request, res: Response) => {
    if (req.cookies.auth_token) return res.redirect('/dashboard');
    res.render('auth/login');
};

// POST: Procesa el login (Este devuelve JSON)
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // 1. Buscar usuario
        const [rows] = await mainDbPool.query<RowDataPacket[]>('SELECT * FROM sys_users WHERE username = ?', [username]);

        if (rows.length === 0) {
            // Devolvemos JSON con error 401 (Unauthorized)
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }

        const user = rows[0];

        // 2. Verificar password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }

        // 3. Crear Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // 4. Guardar Cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
            maxAge: 28800000 // 8 horas
        });

        // 5. RESPONDER CON ÉXITO (JSON)
        // El frontend leerá esto y hará el window.location.href
        return res.json({ success: true, redirectUrl: '/dashboard' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
};

export const logout = (req: Request, res: Response) => {
    res.clearCookie('auth_token');
    res.redirect('/login');
};