import { Request, Response } from 'express';
import * as auditService from './audit.service';

export const renderTimeline = async (req: Request, res: Response) => {
    try {
        const currentUser = res.locals.user;

        // Si es admin ve todo (undefined), si es analista solo su sucursal
        const filterBranch = currentUser.role === 'admin' ? undefined : currentUser.branch_id;

        const logs = await auditService.getAuditTimeline(100, filterBranch);

        res.render('audit/timeline', {
            page: 'audit',
            user: currentUser,
            logs: logs,
            script: 'audit.client.js',
            // Helper para iconos según acción
            getIcon: (action: string) => {
                const icons: any = {
                    'CREATE': 'fa-plus-circle text-success',
                    'UPDATE': 'fa-pencil text-warning',
                    'DELETE': 'fa-trash text-danger',
                    'LOGIN': 'fa-right-to-bracket text-info',
                    'EXECUTE': 'fa-play text-primary',
                    'STOP': 'fa-stop text-danger'
                };
                return icons[action] || 'fa-info-circle text-secondary';
            }
        });
    } catch (e) {
        res.status(500).send('Error cargando auditoría');
    }
};