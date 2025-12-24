import { mainDbPool } from '../../shared/db/main.db';
import { User } from '../../shared/interfaces/user.interface';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';

// Obtener todos (sin devolver el password hash por seguridad)
export const getAllUsers = async (): Promise<User[]> => {
    const [rows] = await mainDbPool.query<RowDataPacket[]>('SELECT id, username, role, created_at FROM sys_users');
    return rows as User[];
};

// Crear Usuario
export const createUser = async (userData: User, rawPassword: string) => {
    // 1. Verificar si existe
    const [existing] = await mainDbPool.query<RowDataPacket[]>('SELECT id FROM sys_users WHERE username = ?', [userData.username]);
    if (existing.length > 0) throw new Error('El nombre de usuario ya existe');

    // 2. Hash del password
    const hash = await bcrypt.hash(rawPassword, 10);

    // 3. Insertar
    const [result] = await mainDbPool.query<ResultSetHeader>(
        'INSERT INTO sys_users (username, password_hash, role) VALUES (?, ?, ?)',
        [userData.username, hash, userData.role]
    );
    return result.insertId;
};

// Actualizar Usuario
export const updateUser = async (id: number, userData: User, newPassword?: string) => {
    // Si envían password nuevo, lo hasheamos. Si no, solo actualizamos rol/nombre.
    let query = 'UPDATE sys_users SET username = ?, role = ? WHERE id = ?';
    let params: any[] = [userData.username, userData.role, id];

    if (newPassword && newPassword.trim() !== '') {
        const hash = await bcrypt.hash(newPassword, 10);
        query = 'UPDATE sys_users SET username = ?, role = ?, password_hash = ? WHERE id = ?';
        params = [userData.username, userData.role, hash, id];
    }

    await mainDbPool.query(query, params);
};

// Eliminar Usuario
export const deleteUser = async (id: number) => {
    await mainDbPool.query('DELETE FROM sys_users WHERE id = ?', [id]);
};