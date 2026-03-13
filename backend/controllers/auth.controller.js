/**
 * CONTROLADOR DE AUTENTICACIÓN
 * =====================================
 * Maneja el registro. Login y obtención del perfil del usuario
 */

// ==================================== IMPORTAR MODELOS ===================================
const Usuario = require('../models/usuario')
const generarToken = require('../config/jws').generarToken;


const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion } = req.body;

        // Validar campos obligatorios
        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre, email y password son requeridos.'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "El formato del email es inválido."
            });
        }

        // Validar longitud de contraseña
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres.'
            });
        }

        // Verificar email duplicado
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe un usuario con ese email "${email}"`,
            });
        }

        // Crear usuario (siempre como cliente por defecto)
        const nuevoUsuario = await Usuario.create({
            nombre,
            email,
            password,
            telefono: telefono || null,
            direccion: direccion || null,
            rol: 'cliente' // Forzamos cliente por defecto
        });

        const token = generarToken({
            id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            rol: nuevoUsuario.rol
        });

        const usuarioRespuesta = nuevoUsuario.toJSON();
        delete usuarioRespuesta.password;

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                usuario: usuarioRespuesta,
                token
            }
        });

    } catch (error) {
        console.error('Error en registrarUsuario: ', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                error: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al crear el usuario',
            error: error.message,
        });
    }
};

/**
 * INICIAR SESION
 * =========================================
 * Autenticar un usuario con email y contraseña
 * Retoma el usuario y un token JWT si las credenciales son correctas
 * 
 * POST /api/auth/login
 * body: {email, password}
 */
const iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: email, password.'
            });
        }

        const usuario = await Usuario.scope('withPassword').findOne({
            where: { email },
        });

        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'El usuario no está activo'
            });
        }

        const validarContrasena = await usuario.compararPassword(password);
        if (!validarContrasena) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const token = generarToken({
            id: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol
        });

        const usuarioSinContrasena = usuario.toJSON();
        delete usuarioSinContrasena.password;

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                usuario: usuarioSinContrasena,
                token
            }
        });

    } catch (error) {
        console.error('Error en iniciarSesion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

/**
 * OBTENER PERFIL DEL USUARIO
 * ===========================================
 * Requiere middleware verificarAuth
 * GET /api/auth/me
 * Headers: {Authorization}
 */
const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.usuario.id, {
            attributes: {
                exclude: ['password']
            }
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        res.json({
            success: true,
            data: {
                usuario: usuario
            }
        });

    } catch (error) {
        console.error('Error en obtenerPerfil: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
        });
    }
};

/**
 * Actualizar perfil del usuario autenticado
 * ========================================================
 * Permite al usuario actualizar su información personal 
 * PUT /api/auth/me
 */
const actualizarPerfil = async (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion } = req.body;

        const usuario = await Usuario.findByPk(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (nombre !== undefined) usuario.nombre = nombre;

        if (email !== undefined) usuario.email = email;
        if (password !== undefined) usuario.password = password;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (direccion !== undefined) usuario.direccion = direccion;

        await usuario.save();

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                usuario: usuario.toJSON()
            }
        });

    } catch (error) {
        console.error('Error en actualizarPerfil: ', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil',
            error: error.message
        });
    }
};

/**
 * CAMBIAR LA CONTRASEÑA DEL USUARIO AUTENTICADO
 * ==============================================
 * Permite al usuario cambiar su contraseña
 * Requiere su contraseña actual por seguridad
 * PUT /api/auth/me/contrasena
 */
const cambiarContrasena = async (req, res) => {
    try {
        const { contrasenaActual, contrasenaNueva } = req.body;

        if (!contrasenaActual || !contrasenaNueva) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: contrasenaActual, contrasenaNueva'
            });
        }

        if (contrasenaNueva.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña nueva debe tener al menos 6 caracteres'
            });
        }

        const usuario = await Usuario.findByPk(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const contrasenaValida = await usuario.compararPassword(contrasenaActual);
        if (!contrasenaValida) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        usuario.password = contrasenaNueva;
        await usuario.save();

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error en cambiarContrasena: ', error);
        return res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

// Función auxiliar para generar token (asumiendo que está definida en jwt.js)

module.exports = {
    registrarUsuario,
    iniciarSesion,
    obtenerPerfil,
    actualizarPerfil,
    cambiarContrasena
};