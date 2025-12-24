import { mainDbPool } from '../../shared/db/main.db';
import { Terminal } from '../../shared/interfaces/terminal.interface';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const getAllTerminals = async (): Promise<Terminal[]> => {
    const [rows] = await mainDbPool.query<RowDataPacket[]>('SELECT * FROM pos_terminals');
    return rows as Terminal[];
};

export const createTerminal = async (data: Terminal) => {
    const [result] = await mainDbPool.query<ResultSetHeader>(
        'INSERT INTO pos_terminals (name, ip_address, db_user, db_pass, is_active, is_server) VALUES (?, ?, ?, ?, ?, ?)',
        [data.name, data.ip_address, data.db_user, data.db_pass, 1, data.is_server ? 1 : 0]
    );
    return result.insertId;
};

export const updateTerminal = async (id: number, data: Terminal, forceBlankPassword?: boolean) => {
    let query = 'UPDATE pos_terminals SET name=?, ip_address=?, db_user=?, is_server=?';
    const params: any[] = [data.name, data.ip_address, data.db_user, data.is_server ? 1 : 0];

    if (forceBlankPassword) {
        query += ', db_pass=?';
        params.push('');
    } else if (data.db_pass) {
        query += ', db_pass=?';
        params.push(data.db_pass);
    }

    query += ' WHERE id=?';
    params.push(id);

    await mainDbPool.query(query, params);
};

export const deleteTerminal = async (id: number) => {
    await mainDbPool.query('DELETE FROM pos_terminals WHERE id = ?', [id]);
};