import { Request, Response, NextFunction } from 'express';

// Permite acceso solo si el rol coincide con uno de los permitidos
export const allowRoles = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const currentUser = res.locals.user;

        if (!currentUser || !roles.includes(currentUser.role)) {
            // Si es una petición API (AJAX), devolvemos JSON
            if (req.xhr || (req.headers.accept?.indexOf('json') ?? -1) > -1) {
                return res.status(403).json({ error: 'Acceso denegado: Permisos insuficientes.' });
            }
            // Si es navegación normal, renderizamos error o redirigimos
            return res.status(403).render('error/403', { message: 'No tienes permiso para ver esta sección.' });
        }

        next();
    };
};