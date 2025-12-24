export interface Terminal {
    id?: number;
    name: string;
    ip_address: string;
    db_user: string;
    db_pass: string;
    is_active?: boolean;
    is_server?: boolean;
}