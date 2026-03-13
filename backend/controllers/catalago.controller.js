/**
 *  CONTROLADORES DE CATALOGO
 * ====================================================================
 * Permite ver los productos sin iniciar sesión
 */

/**
 *  IMPORTAR MODELOS
 * ====================================================================*/
const SubCategoria = require('../models/subCategoria.js');
const Categoria = require('../models/categoria.js');
const Producto = require('../models/producto.js');
const { Op } = require('../config/dataBase.cjs');

/**
 *  IMPORTAR PATH Y FS PARA MANEJAR ARCHIVOS
 * ====================================================================*/
const path = require('path');
const fs = require('fs');

/**
 *  OBTENER TODOS LOS PRODUCTOS AL PUBLICO
 * ====================================================================
 * GET /api/catalogo/productos
 * 
 * QUERY PARAMS:
 * categoriaId: id de la categoria para filtrar por categoria
 * subCategoriaId: id de la subcategoria para filtrar por subcategoria
 * precioMin, precioMax => Filtros por rango de precio
 * orden: precio_asc, precio_desc, reciente, nombre
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 * Solo muestra los productos activos y con stock disponible
 */
const obtenerProductos = async (req, res) => {
    try {
        const { 
            categoriaId, 
            subCategoriaId, 
            precioMax, 
            precioMin, 
            buscar, 
            orden: ordenParam,
            pagina = 1, 
            limite = 12 
        } = req.query;

        // Filtros base solo para productos activos y con stock
        const where = {
            activo: true,
            stock: { [Op.gt]: 0 } // Cambiado a > 0 para mostrar solo productos con stock
        };

        // Filtros opcionales
        if (categoriaId) where.categoriaId = categoriaId;
        if (subCategoriaId) where.subCategoriaId = subCategoriaId; // Corregido: estaba asignando categoriaId

        // Busqueda por texto           
        if (buscar) {
            where[Op.or] = [
                { nombre: { [Op.iLike]: `%${buscar}%` } },
                { descripcion: { [Op.iLike]: `%${buscar}%` } }
            ];
        }

        // Filtros por rango de precio
        if (precioMin || precioMax) {
            where.precio = {};
            if (precioMin) where.precio[Op.gte] = parseFloat(precioMin);
            if (precioMax) where.precio[Op.lte] = parseFloat(precioMax);
        }

        // Ordenamiento 
        let order;
        switch (ordenParam) {
            case 'precio_asc':
                order = [['precio', 'ASC']];
                break;
            case 'precio_desc':
                order = [['precio', 'DESC']];
                break;
            case 'reciente':
                order = [['createdAt', 'DESC']];
                break;
            case 'nombre':
                order = [['nombre', 'ASC']];
                break;
            default:
                order = [['nombre', 'ASC']];
        }

        // =============================== Paginacion ===============================
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        // =============================== Opciones de consulta ===============================
        const opciones = {
            where,
            include: [
                {
                    model: Categoria,
                    as: 'Categoria',
                    attributes: ['id', 'nombre']
                },
                {
                    model: SubCategoria,
                    as: 'SubCategoria',
                    attributes: ['id', 'nombre']
                }
            ],
            limit: parseInt(limite),
            offset,
            order
        };

        // =============================== Obtener productos y total ===============================
        const { count, rows: productos } = await Producto.findAndCountAll(opciones);

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            count,
            data: {
                productos,
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                totalPaginas: Math.ceil(count / parseInt(limite))
            }
        });

    } catch (error) {
        console.error('Error en obtenerProductos: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
};

/**
 * OBTENER PRODUCTO POR ID (PÚBLICO)
 * ====================================================================
 * GET /api/catalogo/producto/:id
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerProductosById = async (req, res) => {
    try {
        const { id } = req.params; // Corregido: usar params, no query

        // =============================== Busca producto con relación ===============================
        const producto = await Producto.findOne({
            where: {
                id,
                activo: true,
                stock: { [Op.gt]: 0 }
            },
            include: [
                {
                    model: Categoria,
                    as: 'Categoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true }
                },
                {
                    model: SubCategoria,
                    as: 'SubCategoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true }
                }
            ]
        });

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            data: { producto }
        });

    } catch (error) {
        console.error('Error en obtenerProductosById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        });
    }
};

/**
 * OBTENER LAS CATEGORIAS CON CONTEO DE PRODUCTOS
 * ====================================================================
 * GET /api/catalogo/categorias
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerCategorias = async (req, res) => {
    try {
        // =============================== Busca categorias activas ===============================
        const categorias = await Categoria.findAll({
            where: { activo: true },
            order: [['nombre', 'ASC']]
        });

        // =============================== Contar productos por categoria ===============================
        const categoriasConConteo = await Promise.all(categorias.map(async (categoria) => {
            const totalProductos = await Producto.count({
                where: {
                    categoriaId: categoria.id,
                    activo: true,
                    stock: { [Op.gt]: 0 }
                }
            });
            return {
                id: categoria.id,
                nombre: categoria.nombre,
                totalProductos
            };
        }));

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            data: categoriasConConteo
        });

    } catch (error) {
        console.error('Error en obtenerCategorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias.',
            error: error.message
        });
    }
};

/**
 * OBTENER LAS SUBCATEGORIAS CON CONTEO DE PRODUCTOS
 * ====================================================================
 * GET /api/catalogo/subcategorias
 * Query param: categoriaId (opcional)
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerSubCategorias = async (req, res) => {
    try {
        const { categoriaId } = req.query;
        
        const where = { activo: true };
        if (categoriaId) where.categoriaId = categoriaId;

        // =============================== Busca subcategorias activas ===============================
        const subCategorias = await SubCategoria.findAll({
            where,
            order: [['nombre', 'ASC']]
        });

        // =============================== Contar productos por subcategoria ===============================
        const subCategoriasConConteo = await Promise.all(subCategorias.map(async (subCategoria) => {
            const totalProductos = await Producto.count({
                where: {
                    subCategoriaId: subCategoria.id, // Corregido: usar subCategoriaId, no categoriaId
                    activo: true,
                    stock: { [Op.gt]: 0 }
                }
            });
            return {
                id: subCategoria.id,
                nombre: subCategoria.nombre,
                categoriaId: subCategoria.categoriaId,
                totalProductos
            };
        }));

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            data: subCategoriasConConteo
        });

    } catch (error) {
        console.error('Error en obtenerSubCategorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener subcategorias.',
            error: error.message
        });
    }
};

/**
 * OBTENER LOS PRODUCTOS DESTACADOS
 * ====================================================================
 * GET /api/catalogo/productos/destacados
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerProductosDestacados = async (req, res) => {
    try {
        // Asumiendo que hay un campo 'destacado' en el modelo Producto
        // Si no existe, puedes modificar este filtro
        const productosDestacados = await Producto.findAll({
            where: { 
                activo: true, 
                stock: { [Op.gt]: 0 },
                // destacado: true // Descomentar si existe el campo
            },
            include: [
                {
                    model: Categoria,
                    as: 'Categoria',
                    attributes: ['id', 'nombre']
                },
                {
                    model: SubCategoria,
                    as: 'SubCategoria',
                    attributes: ['id', 'nombre']
                }
            ],
            limit: 10, // Limitar a 10 productos destacados
            order: [['createdAt', 'DESC']] // Los más recientes primero
        });

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            data: productosDestacados
        });

    } catch (error) {
        console.error('Error en obtenerProductosDestacados: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos destacados.',
            error: error.message
        });
    }
};

// =============================== EXPORTAR MÓDULOS ===============================
module.exports = {
    obtenerProductos,
    obtenerProductosById,
    obtenerCategorias,
    obtenerSubCategorias,
    obtenerProductosDestacados
};