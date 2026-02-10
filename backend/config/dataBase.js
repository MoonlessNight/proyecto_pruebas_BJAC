/*CONFIGURACION DE LA BASE DE DATOS*/

// Importar Sequelize
const { Squelize } = require('sequelize');

// Importar dotenv para variables de entorno
require('dotenv').config();

// Crear instancias de secualize
const sequelize = new Sequelize (
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        host: process.env.DB_PORT,
        dialect: 'mysql',

        // Configuración de pool de conexiones
        // Mantiene las conexiones abiertas para mejorar el rendimiento 
        pool:{
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },

        // Configuracion dde  loggin
        // Permite ver las consultas de mysql por consola
        logging: process.env.NODE_DEV === 'development' ? console-log : false,

        // Zona horaria
        timezone: '-05:00', // Zona horaria de Colombia

        // Opciones adicionales
        define:{
            //timestamps: true crea automaticamente los campos createdAt y updateAt
            timestramps: true,

            // underscored: true una snake_case para nombres de las columnas
            underscored: false,
            
            // frazeTableName: true usa el nombre del modelo tal cual para la tabla 
            frezeTableName: true,

        }
    }
);

/* Funcion para probar la conexion de la base de datos esta funcion se llamara al iniciar el servidor*/

const testConeection = async () => {
    try{
        // Intentar autenticar con la base de datos
        await sequelize.authenticate();
        console.log('Conexion a MySQL estabiliza correctamente');
        return true;
    }
    catch (erro){

        console.error('X Error al conectar con MySQL',error.message);
        console.error('Verifica que Xamppp este corriendo y las credenciales en .env sean correctas');
            return false;
    }
}

//Funcion para sicronizar los modelos con la base de datos
/* Esta funcion creara las tablas autimaticamente basandose en las tablas

- @param {bolean} force - si es true, elimina y recrea todas las tablas

- @param {bolean} alter - si es true, modifica las tablas existentes para que coinicdan con los modelos 
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
    } catch {
        console.error("X Error al sicronizar con la base de datos" , error.message);
        return false;
    }
};

// Exportar las insitancia de sequelize y las funciones
module.exports = {
    sequelize,
    testConnection,
    syncDataBase
}
