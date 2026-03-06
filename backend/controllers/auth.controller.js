/**
 * CONTROLADOR DE AUTENTICACIÓN
 * =====================================
 * Maneja el registro. Login y obtención del perfil del usuario
 */

// ==================================== IMPORTAR MODELOS ===================================
const Usuario = require('../models/usuario');
const bcrypt = require('../config/bcrypt');
const jwt = require('../config/jws');
const { Cipheriv } = require('node:crypto');

const registrarUsuario = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol, telefono, direccion } = req.body;

        // Validación 1 — Verficair que todos los campos requeridos esten presentes
        if (!nombre || !apellido || !email || !password || !rol) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: nombre, apellido, email, password, rol.'
            });
        }

        // Validación 2 — Verificar el formato del email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)){
            return res.status(400).json({
                success: false,
                message: "El formato del email invalida."

            });
        }

        // Verificar 3 — Verificar la longitud de la contraseña
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres.'
            });
        }

        // Verificar 4 — Verificar que el email no este registrado
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe un usuario con ese email "${email}"`,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente.',
            data: {
                usuario: nuevoUsuario.toJSON()
            }
        });
    } catch (error) {
        console.error('Error en registrarUsuario: ', error);
        if (error.name == 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',  
                error: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear el usuario',
            error: error.message,
        });
    }

    }

/**
 * CREAR USUARIO
 * ==========================================================
 * El hook beforeCreate en el modelo se encagar de hashear la contraseña antes de guardarla
 * 
 */
const nuevoUsuario = await Usuario.create({
    nombre,
    apellido,
    email,
    password,
    telefono: telefono || null,
    direccion: direccion || null,
    rol: 'cliente'
});

const toke = generarToken ({
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    rol: nuevoUsuario.rol

})

const usuarioRespuesta = nuevoUsuario.toJSON();
delete usuarioRespuesta.password;
res.status(201).json({
    success: true,
    message: 'Usuario creado exitosamente',
    data: {
        usuario: usuarioRespuesta,
        token
    }
})

/**
 * INICIAR SESION
 * =========================================
 * Autenticar un usuario con email y contraseña
 * Retoma el usuario y un tokem JWT si las credenciales son correctas
 * 
 * POST/ api/auth/login
 * body: {email, password}
 */
const iniciarSesion = async (req, res) => {
    try {
        const {email, password} = req.body;

        // Validación 1 — Veririficar que se proporcionan email y password
        if (!email || !password) {
            return res.status(400).json ({
                success: false,
                message: 'Todos los campos son requeridos: email, password.'

            })
        }

        // Validación 2 — Buscar usuario por email
        // Necesitamos incluir el password aqui normalmente  se exluye por seguridad
        const usuario = await Usuario.findOne({
            where: {email},
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidas'
            });
        }

        // Validación 3 — Verificar que el usuario este activo
        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'El usuario no esta activo'
            });
        }

        // Validación 4 — Verificar la contraseña
        // Usamos el método compararContraseñas del modelo usuario
        const validarContrasena = await usuario.compararContraseña(password);

        if (!validarContrasena) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidas'
            });
        }

        // Generar token JWT con datos básicos del usuario
        const token = generarToken({
            id: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol
        });

        // Prepara respuesta si contraseña
        const usuarioSinContrasena = usuario.toJSON();
        delete usuarioSinContrasena.password;

        // Respuesta

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                usuario: usuarioSinContrasena,
                token
            }
        });

    }catch(error){
        res.json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    
    
    }

};

/**
 * OBTENER PERFIL DEL USUARIO
 * ===========================================
 * Requiere middleware verficarAuth
 * GET  /api/auth/me
 * Headers: {Authorization}
 * 
 */
const obtenerPerfil = async (req, res) => {
    try {
        // El usuario ya esta en req.usuario 
        const usuario = await Usuario.findByPk(req.usuario.id, {
            attributes: {
                exclude: ['password']
            }});

            
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        // Respuesta exitosa
        res.json({
            success: true,
            data: {
                usuario:
            }
        });

    }catch(error){
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
 * @param {Object} req
 * @param {Object} res
 */

const actualizarPerfil = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, direccion } = req.body;

        // Buscar usuario
        const usuario = await Usuario.findByPk(req.usuario.id);
        if (!usuario) {
            res.json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Actualizar capos
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (email !== undefined) usuario.email = email;
        if (password !== undefined) usuario.password = password;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (direccion !== undefined) usuario.direccion = direccion;

        await usuario.save();

        // Respuesta exitosa
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
        const { contrasenaActual, contrasenaNueva} = req.body;

        // Validación 1 — Verificar que se proporcionaron ambas contraseña
        if (!contrasenaActual || !contrasenaNueva) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: contrasenaActual, contrasenaNueva'
         })}

        // Validacion 2 — Verificar que se proporcionaron ambos contraseñas
        if (contrasenaNueva.length < 6)  {
            return res.status(400).json({
                success: false,
                message: ' La contraseña nueva debe tener al menos 6 caracteres'
        })}

        // Validacion 3 — Buscar usuario con contraseña incluido
        const usuario = await Usuario.findByPk(req.usuario.id);
        if (!usuario) {
            return res.status(400).json({
                success: false,
                message: 'Usuario no encontrado'
            });}

        // Validacion 4 — Validar que la contraseña actual sea correcta
        const contrasenaValida = await usuario.compararContraseña(contrasenaActual);
        if (!contrasenaValida) {
            return res.status(400).json({
                success: false,
                message: 'Usuario actual incorrecta'
            });}
            
        // Actualizar contraseña
        usuario.password = contrasenaNueva;
        await usuario.save();

        // Respuesta
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
    }}


module.exports = {
    registrarUsuario,
    iniciarSesion,
    obtenerPerfil,
    actualizarPerfil
}