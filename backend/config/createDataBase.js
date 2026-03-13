/*
* Script de inicialización de la DB
* =======================
* Este script crea la base de datos si no existe
* Debe ejecutarse una sola vez antes de inciar el servidor
*/

const mysql = require('mysql2/promise');
require('dotenv').config();

const createDataBase = async () => {
    let connection;

    try {
        console.log('Iniciando creación de la base de datos...\n');
        console.log('Conectando a MySQL...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        console.log('Conexión a MySQL establecida.\n');

        const dbName = process.env.DB_NAME || 'ecommerce_db';
        console.log(`Creando base de datos: ${dbName}...`);

        // ✅ Consulta corregida: solo SQL, sin mensajes adicionales
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`Base de datos '${dbName}' creada/verificada exitosamente.\n`);

        await connection.end();
        console.log('¡Proceso completado! Ahora puedes iniciar el servidor con: npm start.\n');

    } catch (error) {
        console.error('Error al crear la base de datos: ', error.message);
        console.error('\nVerifica que:');
        console.error('1. XAMPP esté corriendo.');
        console.error('2. MySQL esté activo en XAMPP.');
        console.error('3. Las credenciales en .env sean correctas.\n');

        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
};

createDataBase();