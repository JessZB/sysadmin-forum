import bcrypt from 'bcryptjs';
const run = async () => {
    const hash = await bcrypt.hash('admin123', 10);
    let date = new Date('2025-12-23T07:44:30.000Z');

    console.log(date.toLocaleString());


};
run();