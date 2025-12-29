import { mainDbPool } from '../../shared/db/main.db';
import { Branch } from '../../shared/interfaces/branch.interface';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Obtener todas las sucursales
export const getBranches = async (): Promise<Branch[]> => {
    const [rows] = await mainDbPool.query<RowDataPacket[]>('SELECT id, name, code FROM branches ORDER BY name');
    return rows as Branch[];
};

// Obtener una sucursal por ID
export const getBranchById = async (id: number): Promise<Branch | null> => {
    const [rows] = await mainDbPool.query<RowDataPacket[]>('SELECT id, name, code FROM branches WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return rows[0] as Branch;
};

// Crear sucursal
export const createBranch = async (data: Omit<Branch, 'id'>): Promise<number> => {
    // Verificar si el código ya existe
    const [existing] = await mainDbPool.query<RowDataPacket[]>('SELECT id FROM branches WHERE code = ?', [data.code]);
    if (existing.length > 0) throw new Error('El código de sucursal ya existe');

    const [result] = await mainDbPool.query<ResultSetHeader>(
        'INSERT INTO branches (name, code) VALUES (?, ?)',
        [data.name, data.code]
    );
    return result.insertId;
};

// Actualizar sucursal
export const updateBranch = async (id: number, data: Omit<Branch, 'id'>): Promise<void> => {
    // Verificar si el código ya existe en otra sucursal
    const [existing] = await mainDbPool.query<RowDataPacket[]>(
        'SELECT id FROM branches WHERE code = ? AND id != ?',
        [data.code, id]
    );
    if (existing.length > 0) throw new Error('El código de sucursal ya existe en otra sucursal');

    await mainDbPool.query(
        'UPDATE branches SET name = ?, code = ? WHERE id = ?',
        [data.name, data.code, id]
    );
};

// Eliminar sucursal
export const deleteBranch = async (id: number): Promise<void> => {
    // Verificar si hay usuarios asociados a esta sucursal
    const [users] = await mainDbPool.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM sys_users WHERE branch_id = ?',
        [id]
    );

    if (users[0].count > 0) {
        throw new Error('No se puede eliminar la sucursal porque tiene usuarios asociados');
    }

    // Verificar si hay terminales asociadas a esta sucursal
    const [terminals] = await mainDbPool.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM pos_terminals WHERE branch_id = ?',
        [id]
    );

    if (terminals[0].count > 0) {
        throw new Error('No se puede eliminar la sucursal porque tiene terminales asociadas');
    }

    await mainDbPool.query('DELETE FROM branches WHERE id = ?', [id]);
};
