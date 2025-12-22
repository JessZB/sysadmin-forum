export interface PosTerminal {
    id: number;
    name: string;        // Ej: "Caja 01 - Tienda Centro"
    ip_address: string;  // Ej: "192.168.1.50"
    db_user: string;
    db_pass: string;     
    is_active: boolean;
}

// Define qué esperamos recibir del Job de SQL Server
export interface SqlServerJobStatus {
    JobName: string;
    LastStatus: string;
    LastRunDate: string | null;
}