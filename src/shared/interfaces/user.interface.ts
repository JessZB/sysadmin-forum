export interface User {
    id?: number;
    branch_id: number;
    username: string;
    password_hash?: string;
    role: 'admin' | 'analista' | 'viewer';
    created_at?: Date;
}