/**
 * Configurar la Base de Datos a través de JavaScript
 */

// ======================= Importar sequelize =======================
const { Sequelize } = require('sequelize'); // Hacer conexion con la base de datos


// ======================= Importar dotenv para variables de entorno =======================
require('dotenv').config(); // Variables del entorno del .env

// ======================= Crear instancias de sequelize =======================
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',

        // ======================= Configuración de pool de conexiones =======================
        // Mantiene las conexiones abiertas para mejorar el rendimiento. Conexiones simultáneas
        pool: {
            max: 5,
            min: 0,
            acquire: 30000, // 30s para conectarse. Si no, se pierde
            idle: 10000
        },

        // ======================= Configuracion de logging ======================= 
        // Permite ver las consultas de mysql por consola
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

        // ======================= Zona horaria =======================
        timezone: '-05:00', // Zona horaria de Colombia

        // ======================= Opciones adicionales =======================
        define: {
            // timestamps: true crea automaticamente los campos createdAt y updatedAt
            timestamps: true, // CORREGIDO: era timestramps

            // underscored: true usa snake_case para nombres de columnas
            underscored: false,
            
            // freezeTableName: true usa el nombre del modelo tal cual para la tabla 
            freezeTableName: true, // CORREGIDO: era frezeTableName
        }
    }
);

/* Funcion para probar la conexion de la base de datos */
const testConnection = async () => {
    try {
        // Intentar autenticar con la base de datos
        await sequelize.authenticate(); 
        console.log('✅ Conexion a MySQL establecida correctamente');
        return true;
    } catch (error) { // CORREGIDO: era "erro"
        console.error('❌ Error al conectar con MySQL:', error.message);
        console.error('Verifica que XAMPP este corriendo y las credenciales en .env sean correctas');
        return false;
    }
}

/**
 * Funcion para sincronizar los modelos con la base de datos
 * @param {Boolean} force - si es true, elimina y recrea todas las tablas
 * @param {Boolean} alter - si es true, modifica las tablas existentes
 */
const syncDatabase = async (force = false, alter = false) => { // CORREGIDO: era flase
    try {
        // Sincronizar todos los modelos con la base de datos
        await sequelize.sync({ force, alter });

        if (force) {
            console.log('✅ Base de datos sincronizada (todas las tablas recreadas).');
        } else if (alter) {
            console.log('✅ Base de datos sincronizada (tablas alteradas según los modelos).');
        } else {
            console.log('✅ Base de datos sincronizada correctamente.');
        }
        return true;

    } catch (error) {
        console.error("❌ Error al sincronizar con la base de datos:", error.message);
        return false;
    }
};

// ============================ Exportar ============================
module.exports = {
    sequelize,
    testConnection,
    syncDatabase // CORREGIDO: nombre consistente
};