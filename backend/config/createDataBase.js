/*
* Script de inicialización de la DB
* =======================
* Este script crea la base de datos si no existe
* Debe ejecutarse una sola vez antes de inciar el servidor
*/

const mysql = require('mysql2/promise');

// ======================= Importar dotenv para cargar las variables de entorno =======================
require/('dotenv').config();

// ======================= Funcion para crear la BD =======================
const createDataBase = async ()=> {
    let connection; 

    try {
        console.log('Iniciando creación de la base de datos... \n');

        // ======================= Conectar a MySQL sin especificar BD =======================
        console.log('Conectado a MySQL...\n');

        // ======================= Función de comparar datos con el archivo .env =======================
        connection = await mysql.createConnection ({
                host:process.env.DB_HOST || 'localhost',
                port:process.env.DB_PORT || 3306 ,
                user:process.env.DB_USER || 'root' ,
                password:process.env.DB_PASSWORD || '',
            });

        // ======================= Lanzar mensaje de conexión =======================
        console.log('Conexion a MySQL establecida.\n');

        // ======================= Crear la base de datos si no existe======================= 
        const dbName = process.env.DB_NAME || 'ecommerce_db'; // Variable entonro que toma el nombre de la base de datos del .env
        console.log(`Creando base de datos: ${dbName}...`);

        // ======================= Genera la conexión directamente a la base de datos =======================
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`'${dbName}'creada/verificada existosamente.\n`);

        // ======================= Cerrar conexion =======================
        await connection.end();

        // ======================= Lanzar mensaje por consola, confirmando el proceso =======================
        console.log('¡Proceso completado! Ahora puedes iniciar el servidor con: npm start.\n');

        } catch (error) {
            // ======================= Lanzar un mensaje de error a la consola ======================= 
            console.error('Error al crear la base de datos: ', error.message);
            console.error('\n Verifica que:',);
            console.error('1. XAMPP esta corriendo.',);
            console.error('2. MySQL ese activo en XAMPP.',);
            console.error('3. Las credenciales en .env sean correctas.\n',);

            // ======================= Cerrar conexion =======================
            if (connection) {
                await connection.end();
            } 
            
            // ======================= Termina el proceso =======================
            process.exit(1);
        }
};

// ======================= Ejecutar la función =======================
createDataBase();

