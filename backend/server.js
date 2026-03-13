/**
 * Servidor principal del backend
 * ========================
 * Configura express, middleware, rutas y conexion de base de datos
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar configuración de la base de datos
const { testConnection, syncDatabase } = require('./config/dataBase.cjs');

// Importar modelos (ejecuta asociaciones automáticamente)
require('./models');

// Importar seeders
const { runSeeders } = require('./seeders/adminSeeder');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware globales
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Rutas principales
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor E-Commerce corriendo correctamente',
        version: '1.0.0',
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
    });
});

// Rutas API
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

const clienteRoutes = require('./routes/cliente.routes');
app.use('/api/cliente', clienteRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path,
    });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    if (err.name === "MulterError") {
        return res.status(400).json({
            success: false,
            message: "Error al subir archivo",
            error: err.message,
        });
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Iniciar servidor
const startServer = async () => {
    try {
        // Paso 1 : Probar conexcion a la base de datos
        console.log('Conectando a MySQL...');
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('No se puede conectar a MySQL, verifica XAMPP y el archivo .env');
            process.exit(1); // salir si no hay conexion
        }

        console.log('✅ Conexión a MySQL establecida correctamente');

        console.log('Sincronizando modelos con la base de datos...');
        const alterTables = process.env.NODE_ENV === 'development';
        const dbSynced = await syncDatabase(false, alterTables);
        if (!dbSynced) {
            console.error('No se pudo sincronizar los modelos con la base de datos');
            process.exit(1);
        }
        console.log('✅ Modelos sincronizados correctamente');

        console.log('Ejecutando seeders...');
        await runSeeders();
        console.log('✅ Seeders ejecutados correctamente');

        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(40));
            console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
            console.log('='.repeat(40) + '\n');
            console.log(`📍 URL de acceso: http://localhost:${PORT}`);
            console.log(`📍 Modo: ${process.env.NODE_ENV || 'development'}`);
            console.log('✅ Servidor listo para recibir peticiones\n');
        });

    } catch (error) {
        console.error('❌ Error fatal al iniciar el servidor: ', error.message);
        process.exit(1);
    }
};

// Manejo de cierre
process.on('SIGINT', () => {
    console.log('\n\n👋 Cerrando servidor...');
    process.exit(0);
});
process.on('uncaughtException', (err) => {
    console.error('❌ Error no manejado:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

if (require.main === module) {
    startServer();
}

module.exports = app;