export interface User {
    id?: number;
    username: string;
    password_hash?: string;
    role: 'admin' | 'analista' | 'viewer'; // <--- Agregamos analista
    created_at?: Date;
}