import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'MI_CLAVE_SECRETA_COMPARTIDA';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.locals.user = decoded;
        next();
    } catch (error) {
        // --- CORRECCIÓN AQUÍ ---
        // Si el token es inválido (expiró o servidor reinició),
        // BORRAMOS la cookie para evitar el bucle infinito en /login
        res.clearCookie('auth_token');
        return res.redirect('/login');
    }
};

// Middleware para proteger rutas de API (Si falla, devuelve JSON 401)
export const requireApiAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: 'No autorizado' });

    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};