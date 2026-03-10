/**
 * Servidor principal del backend
 * ========================
 * este es el archivo principal del servidor del backend
 * Configura express, middleware, rutas y conexion de base de datos
 */

// Importar express para crear el servidor
const express = require('express');

// Importar cors para permitir solicitudes desde el frontend
const cors = require('cors');

// Importar path para manejar rutas de archivos
const path = require('path'); // CORREGIDO: requiere -> require

// Importar dotenv para manejar variables de entorno
require('dotenv').config();

// Importar configuracion de la base de datos
const dbConfig = require('./backend/config/dataBase');

// Importar modelos y asociaciones
const { initAssociations } = require('./backend/models');

// Importar seeders
const { runSeeders } = require('./backend/seeders/adminSeeder');

// Importar funciones de conexión y sincronización
const { testConnection, syncModels } = require('./backend/config/dataBase');

// Crear aplicacion express
const app = express();

// Obtener el puerto desde variables de entorno
const PORT = process.env.PORT || 3000;

// Middleware globales
// Cors permite peticiones desde el frontend
// Configura que dominios pueden hacer peticiones al backend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // CORREGIDO: FRONTED -> FRONTEND
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // AÑADIDO: PATCH
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Servir archivos estaticos imagenes 
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para loggear peticiones
// Muestra en consola cada petición que llega al servidor
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Rutas principales

// Ruta raíz - CORREGIDO: comilla mal colocada
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor E-Commerce corriendo correctamente',
        version: '1.0.0',
    });
});

// Ruta de salud - CORREGIDO: sintaxis de arrow function
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy', // CORREGIDO: heatthy -> healthy
        database: 'connected',
        timestamp: new Date().toISOString() // CORREGIDO: Data -> Date
    });
});

// Rutas api
// rutas de autenticación
// Incluye registro, inicio de sesion, perfil
const authRoutes = require('./backend/routes/auth.routes');
app.use('/api/auth', authRoutes);

// Rutas del admin
// Requiere autenticacion y rol de admin
const adminRoutes = require('./backend/routes/admin.routes');
app.use('/api/admin', adminRoutes);

// Rutas del cliente
// Requiere autenticacion y rol de cliente
const clienteRoutes = require('./backend/routes/cliente.routes');
app.use('/api/cliente', clienteRoutes);

// Manejo de rutas no encontradas (404) - CORREGIDO: sintaxis
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path,
    });
});

// Manejo de errores globales - CORREGIDO: estructura y ubicación
app.use((err, req, res, next) => {
    // Error de Multer (subida de archivos)
    if (err.name === "MulterError") {
        return res.status(400).json({
            success: false,
            message: "Error al subir archivo",
            error: err.message,
        });
    }
    
    // Otros errores
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Iniciar servidor y base de datos

/**
 * Funcion principal para iniciar el servidor
 * prueba la conexión a MySQL
 * Sincroniza los modelos (crea las tablas)
 */
const startServer = async () => {
    try {
        console.log('Conectando a MySQL...'); // CORREGIDO: Coectado -> Conectando
        
        // Probar conexión a la base de datos
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('No se puede conectar a MySQL, verifica XAMPP y el archivo .env');
            process.exit(1);
        }
        console.log('✅ Conexión a MySQL establecida correctamente');

        console.log('Sincronizando modelos con la base de datos...');
        
        // Inicializar asociaciones entre modelos
        initAssociations();

        // En desarrollo alter puede ser true para actualizar la estructura
        // En produccion debe ser false para no perder datos
        const alterTables = process.env.NODE_ENV === 'development';
        
        // Sincronizar modelos
        const dbSynced = await syncModels(alterTables);
        if (!dbSynced) {
            console.error('No se pudo sincronizar los modelos con la base de datos');
            process.exit(1);
        }
        console.log('✅ Modelos sincronizados correctamente');

        // Paso 3 Ejecutar seeders (datos iniciales)
        console.log('Ejecutando seeders...');
        await runSeeders();
        console.log('✅ Seeders ejecutados correctamente');

        // Paso 4 Iniciar el servidor express
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(40));
            console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
            console.log('='.repeat(40) + '\n');
            console.log(`📍 URL de acceso: http://localhost:${PORT}`); // CORREGIDO: concatenación
            console.log(`📍 Modo: ${process.env.NODE_ENV || 'development'}`);
            console.log('✅ Servidor listo para recibir peticiones\n');
        });

    } catch (error) {
        console.error('❌ Error fatal al iniciar el servidor: ', error.message);
        process.exit(1);
    }
};

// Manejo de cierre
// Captura el Ctrl+C para cerrar el servidor correctamente
process.on('SIGINT', () => {
    console.log('\n\n👋 Cerrando servidor...');
    process.exit(0);
});

// Capturar errores no manejados
process.on('uncaughtException', (err) => {
    console.error('❌ Error no manejado:', err);
    process.exit(1);
});

// Capturar promesas rechazadas no manejadas
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

// Iniciar servidor
startServer();

// Exportar app para testing 
module.exports = app;