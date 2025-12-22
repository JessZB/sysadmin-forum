import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import posRoutes from './modules/pos-jobs/pos.routes';


dotenv.config();

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta Base
app.get('/', (req: Request, res: Response) => {
    res.json({ 
        system: 'SysAdmin Monitor', 
        tech: 'Node.js + TypeScript + MySQL' 
    });
});

// Rutas Modulares
app.use('/api/pos-jobs', posRoutes);

// Manejo de Errores Tipado
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor TS corriendo en puerto ${PORT}`);
});