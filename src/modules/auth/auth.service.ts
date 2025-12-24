import { mainDbPool } from '../../shared/db/main.db';
import { RowDataPacket } from 'mysql2';

// Obtener usuario por username

export const getUserByUsername = async (username: string) => {
    const [rows] = await mainDbPool.query<RowDataPacket[]>('SELECT * FROM sys_users WHERE username = ?', [username]);
    return rows[0];
};
