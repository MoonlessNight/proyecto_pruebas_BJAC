/**
 * CONTROLADOR DE USUARIOS ADMIN
 * ====================================================================
 * Gestión de usuarios
 * Lista 
 */

/**
 *  IMPORTAR MODELOS
 * ====================================================================*/
import { error } from 'node:console';
import Usuario from '../models/usuario.js';

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
                { correo: { [Op.iLike]: `%${buscar}%` } }
            ]
        }

        // Paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        // Obtener usuarios sin contraseña
        const { count, rows: usuarios } = await Usuario.findAndCountAll({
            where,
            attributes: {
                exclude: ['password']
            },
            offset: (parseInt(pagina) - 1) * parseInt(limite),
            order: [['nombre', 'ASC']]
        });

        // Respuesta existosa
        res.json({
            success: true,
            paginacion: {
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                total: count,
                totalPaginas: Math.ceil(count / parseInt(limite))
            },
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
 * POST / aip / admin / usuarios
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

        // Validación 2 verificar que el email no existia
        const usuarioExistente = await Usuario.findOne({ where: { email } });

        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe un usuario con ese email "${email}"`,
            });
        }

        // Validar 3 Verificar rol
        if (!['cliente', 'auxilizar', 'adminstrador'].includes(rol)) {
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

        // Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente.',
            data: {
                usuario: nuevoUsuario.toJSON()
            }
        });

    } catch (error) {
        console.error('Error en crearUsuario: ', error);
        if (error.name == 'SequelizeValidationError') {
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
        })
    }
};

/**
 * ACTUALIZAR USUARIOS
 * ==========================================================
 * PUT / api / admin / usuarios / :id
 * body: {nombre, apellido, email, password, rol, telefono, direccion}
 * 
 * @param {Object} req - request express
 * @param {Object} res - responde express
 */
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, email, password, rol, telefono, direccion } = req.body;

        // Buscar usuario 
        const usuario = await Usuario.findByPk(id);

        if (!usuario) ({
            success: false,
            message: 'Usuario no encontrado'
        });

        // Validar rol si es proporcionado
        if (rol && !['cliente', 'administrador'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol invalido. Los roles permitidos son: cliente, administrador.'
            });
        }

        // Actualizar campos
        if (nombre !== undefined) Usuario.nombre = nombre;
        if (apellido !== undefined) Usuario.apellido = apellido;
        if (email !== undefined) Usuario.email = email;
        if (password !== undefined) Usuario.password = password;
        if (rol !== undefined) Usuario.rol = rol;
        if (telefono !== undefined) Usuario.telefono = telefono;
        if (direccion !== undefined) Usuario.direccion = direccion;

        await usuario.save();


        // Respuesta exitosa 
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: {
                usuario
            }
        });
    } catch (error) {
        console.log('Error en actuaizarUsuario: ', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de valiación',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario.',
            error: error.message
        })
    }
};

/**
 * ALTERNAR USUARIO
 * =====================================
 * PATCH /api/admin/usuarios
 * 
 * @param {Object} req
 * @param {Object} res
 */
const alternarUsuario = async (req, res) => {
    try { 
        const {id} = req.params;
        
        // Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if (!usuario){
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        
        if (usuario.id === req.usuario.id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes desactivar tu propio usuario.'})
        }
            
        // Alternar estado
        usuario.activo = !usuario.activo;
        await usuario.save();

        // Respuesta
        res.json({
            success: true,
            message: `Usuario cambio al estado ${usuario.activo ? 'activo' : 'desactivado'} de forma exitosa.`,
            data: {
                usuario: usuario.toJSON()
            }
        })

    }catch(error){
        console.error('Error en alternarUsuario: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al alternar estado de usuario',
            error: error.message
        });
    }}
        
/**
 * ELIMINAR USUARIO
 * ===========================================
 * DELETE /api/admin/usuario
 * 
 * @param {Object} req
 * @param {Object} res
 */
const eliminarUsuario = async (req, res) => {
    try {
        const {id} = req.params;

        // Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if (!usuario){
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Respues exitosa
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente',
            error: error.message
            })
        } catch (error){
            console.error('Error en eliminarUsuario: ', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar usuario',
                error: error.message
            });
}}

/**
 * OBTENER ESTADISTICAS DE LOS USUARIO
 * ============================================
 * GET /api/admin/usuarios/estadisticas
 * 
 * @param {Object} req
 * @param {Object} res 
 */
const obtenerEstadisticasUsuarios = async (req, res) => {
    try{
        // Datos de usuario
        const totalUsuarios = await Usuario.count();
        const totalClientes = await Usuario.count({where: {rol: 'cliente'}});
        const totalAdmins = await Usuario.count({where: {rol: 'administrador'}});
        const usuariosActivos = await Usuario.count({where: {activo: true}});
        const usuariosInactivos = await Usuario.count({where: {activo: false}});
    
        res.json({
            success: true,
            data: {
                total: totalUsuarios,
                porRol: {
                    cliente: totalClientes,
                    administrador: totalAdmins
                },
                porEstado: {
                    activos: usuariosActivos,
                    inactivos: usuariosInactivos
                }
            },
            message: 'Estadisticas de usuarios obtenidas exitosamente.'
        })

    }catch(error){
        console.error('Error en obtenerEstadisticasUsuarios: ', error);
        res.json({
            success: false,
            message: 'Error al obtener estadisticas de usuarios',
            error: error.message
        });
    }
}

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioById,
    crearUsuario,
    actualizarUsuario,
    alternarUsuario,
    eliminarUsuario,
    obtenerEstadisticasUsuarios
}
