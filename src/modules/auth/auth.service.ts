import { mainDbPool } from '../../shared/db/main.db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

// Clave secreta (idealmente en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'MI_CLAVE_SECRETA_COMPARTIDA';

export const login = async (username: string, pass: string): Promise<{ token: string; user: any } | null> => {
    // 1. Buscamos el usuario Y su sucursal
    const query = `
        SELECT u.id, u.username, u.password_hash, u.role, u.branch_id, b.name as branch_name
        FROM sys_users u
        LEFT JOIN sys_branches b ON u.branch_id = b.id
        WHERE u.username = ? AND u.is_active = 1
    `;

    const [rows] = await mainDbPool.query<RowDataPacket[]>(query, [username]);

    if (rows.length === 0) return null;

    const user = rows[0];
    const match = await bcrypt.compare(pass, user.password_hash);

    if (!match) return null;

    // 2. Generamos el Payload del Token con la NUEVA información
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,       // <--- CRÍTICO para filtrar datos
        branch_name: user.branch_name    // <--- Útil para UI
    };

    // 3. Firmar Token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return { token, user: payload };
};