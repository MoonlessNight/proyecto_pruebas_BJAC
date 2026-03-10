/**
 * CONTROLADOR DE USUARIOS ADMIN
 * ====================================================================
 * Gestión de usuarios
 */

/**
 *  IMPORTAR MODELOS
 * ====================================================================*/
const Usuario = require('../models/usuario.js');
const { Op } = require('sequelize');

/**
 * OBTENER TODOS LOS USUARIOS
 * ====================================================================
 * GET /api/admin/usuarios
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerUsuarios = async (req, res) => {
    try {
        const { rol, activo, buscar, pagina = 1, limite = 10 } = req.query;

        // Filtros
        const where = {};
        if (rol) where.rol = rol;
        if (activo !== undefined) where.activo = activo === 'true';

        // Busqueda por texto
        if (buscar) {
            where[Op.or] = [
                { nombre: { [Op.iLike]: `%${buscar}%` } },
                { apellido: { [Op.iLike]: `%${buscar}%` } },
                { email: { [Op.iLike]: `%${buscar}%` } }
            ];
        }

        // Paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        // Obtener usuarios sin contraseña
        const { count, rows: usuarios } = await Usuario.findAndCountAll({
            where,
            attributes: {
                exclude: ['password']
            },
            offset,
            limit: parseInt(limite),
            order: [['nombre', 'ASC'], ['apellido', 'ASC']]
        });

        // Respuesta exitosa - CORREGIDO: faltaba incluir los usuarios en la respuesta
        res.json({
            success: true,
            data: {
                usuarios
            },
            paginacion: {
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                total: count,
                totalPaginas: Math.ceil(count / parseInt(limite))
            }
        });
    } catch (error) {
        console.error('Error en obtenerUsuarios: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

/**
 * OBTENER USUARIO POR ID
 * ====================================================================
 * GET /api/admin/usuarios/:id
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener usuario sin contraseña
        const usuario = await Usuario.findByPk(id, {
            attributes: {
                exclude: ['password']
            }
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Respuesta exitosa
        res.json({
            success: true,
            data: { usuario }
        });
    } catch (error) {
        console.error('Error en obtenerUsuarioById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
};

/**
 * CREAR UN USUARIO
 * ================================================
 * POST /api/admin/usuarios
 * Body: {nombre, apellido, email, password, rol, telefono, direccion}
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const crearUsuario = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol, telefono, direccion } = req.body;

        // Validación 1 verificar campos requeridos
        if (!nombre || !apellido || !email || !password || !rol) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: nombre, apellido, email, password, rol.'
            });
        }

        // Validación 2 verificar que el email no exista
        const usuarioExistente = await Usuario.findOne({ where: { email } });

        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe un usuario con el email "${email}"`,
            });
        }

        // Validar 3 Verificar rol - CORREGIDO: 'auxiliar' y 'administrador' estaban mal escritos
        const rolesPermitidos = ['cliente', 'auxiliar', 'administrador'];
        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol invalido. Los roles permitidos son: cliente, auxiliar, administrador.'
            });
        }

        // Crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password,
            rol,
            telefono: telefono || null,
            direccion: direccion || null,
            activo: true
        });

        // Obtener usuario sin password para la respuesta
        const usuarioResponse = nuevoUsuario.toJSON();
        delete usuarioResponse.password;

        // Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente.',
            data: {
                usuario: usuarioResponse
            }
        });

    } catch (error) {
        console.error('Error en crearUsuario: ', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion.',
                errors: error.errors.map(e => e.message)
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
 * ACTUALIZAR USUARIOS
 * ==========================================================
 * PUT /api/admin/usuarios/:id
 * body: {nombre, apellido, email, password, rol, telefono, direccion}
 * 
 * @param {Object} req - request express
 * @param {Object} res - responde express
 */
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, email, password, rol, telefono, direccion, activo } = req.body;

        // Buscar usuario 
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ // CORREGIDO: faltaba el return
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Validar email único si se proporciona
        if (email && email !== usuario.email) {
            const emailExistente = await Usuario.findOne({ where: { email } });
            if (emailExistente) {
                return res.status(400).json({
                    success: false,
                    message: `El email "${email}" ya está en uso por otro usuario.`
                });
            }
        }

        // Validar rol si es proporcionado - CORREGIDO: lista completa de roles
        const rolesPermitidos = ['cliente', 'auxiliar', 'administrador'];
        if (rol && !rolesPermitidos.includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol invalido. Los roles permitidos son: cliente, auxiliar, administrador.'
            });
        }

        // Actualizar campos - CORREGIDO: usar usuario, no Usuario (modelo)
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (email !== undefined) usuario.email = email;
        if (password !== undefined) usuario.password = password; // Se encriptará automáticamente por el hook del modelo
        if (rol !== undefined) usuario.rol = rol;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (direccion !== undefined) usuario.direccion = direccion;
        if (activo !== undefined) usuario.activo = activo;

        await usuario.save();

        // Obtener usuario sin password para la respuesta
        const usuarioResponse = usuario.toJSON();
        delete usuarioResponse.password;

        // Respuesta exitosa 
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: {
                usuario: usuarioResponse
            }
        });
    } catch (error) {
        console.error('Error en actualizarUsuario: ', error); // CORREGIDO: console.log a console.error

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario.',
            error: error.message
        });
    }
};

/**
 * ALTERNAR ESTADO DEL USUARIO (ACTIVAR/DESACTIVAR)
 * =====================================
 * PATCH /api/admin/usuarios/:id/toggle
 * 
 * @param {Object} req
 * @param {Object} res
 */
const alternarUsuario = async (req, res) => {
    try { 
        const { id } = req.params;
        
        // Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if (!usuario){
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Prevenir que un admin se desactive a sí mismo
        if (req.usuario && req.usuario.id === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'No puedes desactivar tu propio usuario.'
            });
        }
            
        // Alternar estado
        usuario.activo = !usuario.activo;
        await usuario.save();

        // Obtener usuario sin password
        const usuarioResponse = usuario.toJSON();
        delete usuarioResponse.password;

        // Respuesta
        res.json({
            success: true,
            message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} de forma exitosa.`,
            data: {
                usuario: usuarioResponse
            }
        });

    } catch(error){
        console.error('Error en alternarUsuario: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al alternar estado de usuario',
            error: error.message
        });
    }
};
        
/**
 * ELIMINAR USUARIO
 * ===========================================
 * DELETE /api/admin/usuarios/:id
 * 
 * @param {Object} req
 * @param {Object} res
 */
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if (!usuario){
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Prevenir que un admin se elimine a sí mismo
        if (req.usuario && req.usuario.id === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propio usuario.'
            });
        }

        // Eliminar usuario
        await usuario.destroy();

        // Respuesta exitosa - CORREGIDO: estructura incorrecta
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminarUsuario: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
};

/**
 * OBTENER ESTADISTICAS DE LOS USUARIOS
 * ============================================
 * GET /api/admin/usuarios/estadisticas
 * 
 * @param {Object} req
 * @param {Object} res 
 */
const obtenerEstadisticasUsuarios = async (req, res) => {
    try {
        // Datos de usuario
        const totalUsuarios = await Usuario.count();
        const totalClientes = await Usuario.count({ where: { rol: 'cliente' } });
        const totalAuxiliares = await Usuario.count({ where: { rol: 'auxiliar' } }); // AÑADIDO: conteo de auxiliares
        const totalAdmins = await Usuario.count({ where: { rol: 'administrador' } });
        const usuariosActivos = await Usuario.count({ where: { activo: true } });
        const usuariosInactivos = await Usuario.count({ where: { activo: false } });
    
        res.json({
            success: true,
            data: {
                total: totalUsuarios,
                porRol: {
                    cliente: totalClientes,
                    auxiliar: totalAuxiliares,
                    administrador: totalAdmins
                },
                porEstado: {
                    activos: usuariosActivos,
                    inactivos: usuariosInactivos
                }
            },
            message: 'Estadisticas de usuarios obtenidas exitosamente.'
        });

    } catch(error) {
        console.error('Error en obtenerEstadisticasUsuarios: ', error);
        res.status(500).json({ // CORREGIDO: status 500
            success: false,
            message: 'Error al obtener estadisticas de usuarios',
            error: error.message
        });
    }
};

// =============================== EXPORTAR MÓDULOS ===============================
module.exports = {
    obtenerUsuarios,
    obtenerUsuarioById,
    crearUsuario,
    actualizarUsuario,
    alternarUsuario,
    eliminarUsuario,
    obtenerEstadisticasUsuarios
};