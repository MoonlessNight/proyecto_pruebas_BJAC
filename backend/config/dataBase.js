
/**
 * Configurar la Base de Datos Através de JavaScript
 */

// ======================= Importar Sequelize =======================
const { sequelize } = require('sequelize'); // Hacer conexion con la base de datos

// ======================= Importar dotenv para variables de entorno =======================
require('dotenv').config(); // Variables del entorno del .env

// ======================= Crear instancias de secualize =======================
const sequelize = new sequelize (
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        HOST: process.env.DB_HOST,
        PORT: process.env.DB_PORT,
        dialect: 'mysql',

        // ======================= Configuración de pool de conexiones =======================
        // Mantiene las conexiones abiertas para mejorar el rendimiento. Conexiones sumiltaneas
        pool:{
            max: 5,
            min: 0,
            acquire: 30000, // 30s para conetarse. Si no, se pierde
            idle: 10000
        },

        // ======================= Configuracion de loggin ======================= 
        // Permite ver las consultas de mysql por consola
        logging: process.env.NODE_DEV === 'development' ? console-log : false,

        // ======================= Zona horaria =======================
        timezone: '-05:00', // Zona horaria de Colombia

        // ======================= Opciones adicionales =======================
        define:{
            //timestamps: true crea automaticamente los campos createdAt y updateAt
            timestramps: true,

            // underscored: true una snake_case para nombres de las columnas. Crea los nombres de la columnas
            underscored: false,
            
            // frazeTableName: true usa el nombre del modelo tal cual para la tabla 
            frezeTableName: true,
        }});

/* Funcion para probar la conexion de la base de datos esta funcion se llamara al iniciar el servidor */
const testConnection = async () => {
    try{
        // Intentar autenticar con la base de datos
        await sequelize.authenticate(); 
        console.log('Conexion a MySQL estabiliza correctamente');
        return true;
    } catch (erro) {
        console.error('X Error al conectar con MySQL',error.message);
        console.error('Verifica que Xamppp este corriendo y las credenciales en .env sean correctas');
            return false;
    }
}


/**
 * Funcion para sicronizar los modelos con la base de datos
 * =====================================================
 * Esta funcion creara las tablas autimaticamente basandose en los modelos
 * @param {Boolean} force - si es true, elimina y recrea todas las tablas
 * @param {Boolean} alter - si es true, modifica las tablas existentes para que coinicdan con los modelos 
 * @returns 
 */
const syncDataBase = async (force = false, alter = flase) => {
    try {
        // Sincronizar todos los modelos con la base de datos
        await sequelize.sync({force, alter});

        if (force) {
            console.log('Base de datos sincronizada (todas las tablas recreadas).');
        } else if (alter) {
            console.log('Base de datos sincronizada (tablas alteradas según los modelos).');
        } else {
            console.log('Base de datos sincronizada correctamente.');
        }
        return true;

    } catch (error) {
        console.error("X Error al sicronizar con la base de datos." , error.message);
        return false;
    }
};

// ============================ Exportar las insitancia de sequelize y las funciones ============================
module.exports = {
    sequelize,
    testConnection,
    syncDataBase
}
