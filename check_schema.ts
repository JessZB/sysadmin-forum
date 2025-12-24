
import { mainDbPool } from './src/shared/db/main.db';

async function checkSchema() {
    try {
        const [rows] = await mainDbPool.query('DESCRIBE pos_terminals');
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error(error);
    } process.exit();
}

checkSchema();
