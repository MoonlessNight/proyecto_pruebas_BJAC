/**
 *  CONTROLADORES DE CATALOGO
 * ====================================================================
 * Permite ver los producos sin iniciar sesión
 */

/**
 *  IMPORTAR MODELOS
 * ====================================================================*/
import SubCategoria from '../models/subCategoria.js';
import Categoria from '../models/categoria.js';
import Producto from '../models/producto.js';
import { link } from 'node:fs';


/**
 *  OBTENER TODOS LOS PRODUCTOS AL PUBLICO
 * ====================================================================
 * GET /api/catalago/producos
 * 
 * QUERY PARAMS:
 * categoriaId: id de la categoria para filtrar por categoria
 * subCategoriaId: id de la categoria para filtrar por subcategoria
 * precioMin, precioMax => Filstros por rango de precio
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 * Solo muestra los productos activos y con stock disponible
 *  */
const obtenerProductos = async (req, res) => {
    try {
        const { categoriaId, subCategoriaId, activo, precioMax, precioMin, buscar, pagina = 1, limite = 12 } = req.query;
        const { Op } = require('sequelize');

        // Filtros base solo para productos activos y con stock
        const where = {
            activo: true,
            stock: { [Op.gte]: 0 }
        };

        // Filtros opcionales
        if (categoriaId) where.categoriaId = categoriaId;
        if (subCategoriaId) where.subCategoriaId = categoriaId;

        // Busqueda por texto           
        if (buscar) {
            where[Op.or] = [
                { nombre: { [Op.iLike]: `%${buscar}%` } },
                { descripcion: { [Op.iLike]: `%${buscar}%` } }
            ]
        }

        // Filtros por rango de precio
        if (precioMin && precioMax) {
            where.precio = {};
            if (precioMin) where.precio[Op.gte] = parseFloat(precioMin);
            if (precioMax) where.precio[Op.lte] = parseFloat(precioMax);
        };

        // Ordenamiento 
        let orden;
        switch (orden) {
            case 'precio_asc':
                orden = [['precio', 'ASC']];
                break;
            case 'precio_desc':
                orden = [['precio', 'DESC']];
                break;
            case 'reciente':
                orden = [['createdAt', 'DESC']];
                break;
            case 'nombre':
                orden = [['nombre', 'ASC']];
                break;
            default:
                orden = [['nombre', 'ASC']]

        }

        // =============================== Opciones de consulta ===============================
        const opciones = {
            where,
            include: [{
                model: Categoria,
                as: 'Categorias',
                attributes: ['id', 'nombre', 'activo']
            },
            {
                model: SubCategoria,
                as: 'SubCategorias',
                attributes: ['id', 'nombre', 'activo']
            }],
            limit: parseFloat(limite),
            offset,
            order: [['nombre', 'ASC']]
        };

        // =============================== Obtener productos y total ===============================
        const { count, rows: productos } = await Producto.findAndCountAll(opciones);

        // =============================== Filtros ===============================
        if (categoriaId) where.categoriaId = categoriaId;
        if (subCategoriaId) where.subCategoriaId = subCategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (conStock !== undefined) where.stock = { [require('sequelize').Op.gte]: 0 };
        if (buscar) where.nombre = { [require('sequelize').Op.iLike]: `%${buscar}%` };

        if (Object.keys(where).length > 0) {
            opciones.where = where;
        }

        // =============================== Paginacion ===============================
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

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
        })
    }
}

/**
 * OBTENER LOS PRODUCTOS POR ID
 * ====================================================================
 * GET / api / admin / producto /:id
 * 
 * - Activo true/false (filtrar por estado)
 * - incluirsubcategorias true/false (incluir subcategoria relacionadas)
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerProductosById = async (req, res) => {
    try {
        const { id } = req.query;

        // =============================== Busca productos con relación ===============================
        const producto = await Producto.findByPk(id, {
            where: {
                id,
                activo: true
            },
            incluide: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id'],
                    where: { activo: true }
                },
                {
                    model: SubCategoria,
                    as: 'subCategoria',
                    attributes: ['id'],
                    where: { activo: true }
                }
            ],
            limite: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
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
            data: {
                productos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count / parseInt(limite))
                }
            }
        });

    } catch (error) {
        console.error('Error en obtenerProductosById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        })
    }
};


/**
 * OBTENER LAS CATEGORIAS CON CONTEO DE PRODUCTOS
 * ====================================================================
 * GET / api / admin / categorias
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerCategorias = async (req, res) => {
    try {
        const { Op } = require('sequelize');

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
                ...categoria.toJSON(),
                totalProductos
            };
        }));

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            data: categoriasConConteo
        });

    } catch (error) {
        console.error('Error en conteoCategorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener conteo de categorias.',
            error: error.message
        });
    }
};

/**
 * OBTENER LAS SUBCATEGORIAS CON CONTEO DE PRODUCTOS
 * ====================================================================
 * GET / api / admin / subcategorias
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerSubCategorias = async (req, res) => {
    try {
        const { Op } = require('sequelize');

        // =============================== Busca subcategorias activas ===============================
        const subCategorias = await SubCategoria.findAll({
            where: { activo: true },
            order: [['nombre', 'ASC']]
        });

        // =============================== Contar productos por subcategoria ===============================
        const subCategoriasConConteo = await Promise.all(subCategorias.map(async (subCategoria) => {
            const totalProductos = await Producto.count({
                where: {
                    categoriaId: subCategoria.id,
                    activo: true,
                    stock: { [Op.gt]: 0 }
                }
            });
            return {
                ...subCategoria.toJSON(),
                totalProductos
            };
        }));

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            data: subCategoriasConConteo
        });

    } catch (error) {
        console.error('Error en conteoSubcategorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener conteo de subcategorias.',
            error: error.message
        });
    }
};

/**
 * OBTENER LOS PRODUCTOS DESTACADOS
 * ====================================================================
 * GET / api / admin / subcategorias
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerProductosDestacados = async (req, res) => {
    try {
        const { Op } = require('sequelize');

        // =============================== Busca subcategorias activas ===============================
        const productosDestacados = await SubCategoria.findAll({
            where: { activo: true },
            order: [['nombre', 'ASC']]
        });

        // =============================== Contar productos por subcategoria ===============================
        const productosDestacadosConConteo = await Promise.all(productosDestacados.map(async (productoDestacado) => {
            const totalProductos = await Producto.count({
                where: {
                    subCategoriaId: productoDestacado.id,
                    activo: true,
                    stock: { [Op.gt]: 0 }
                }
            });
            return {
                ...productoDestacado.toJSON(),
                totalProductos
            };
        }));

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            data: productosDestacadosConConteo
        });

    } catch (error) {
        console.error('Error en conteoProductosDestacados: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener                                                                                              conteo de productos destacados.',
            error: error.message
        });
    }
};


/**
 * ACTUALIZAR PRODUCTO
 * ====================================================================
 * PUT / api / admin / productos / :id
 * body: {nombre, descripcion}
 * 
 * @param {Object} req - request express
 * @param {Object} res - responde express
 */
const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        // =============================== Buscar subcategoria ===============================
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // =============================== Validación 1 — Verificar categoria ===============================
        if (categoriaId && categoriaId !== producto.categoriaId) {
            const categoria = await Producto.findByPk(categoriaId);

            if (!categoria || !categoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: 'Categoria incalida o inactiva',
                })
            }
        }

        // =============================== Validación 2 — Verificar subcategoria ===============================
        if (subCategoriaId && subCategoriaId !== producto.subCategoriaId) {
            const subCategoria = await Producto.findByPk(categoriaId);

            if (!subCategoria || !subCategoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: 'Categoria incalida o inactiva',
                })
            }
        }
        const catId = categoriaId || producto.categoriaId

        // =============================== Validación 3 — Verificar subcategoria ===============================
        if (!subCategoria.categoriaId !== parseInt(catId)) {
            return res.status(400).json({
                success: false,
                message: 'La subcategoria no pertenece a la categoria seleccionada.',
            })
        }

        // =============================== Validación 4 — Verificar stock ===============================
        if (stock !== undefined && parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: `El producto "${nombre}" debe ser mayor a 0 unidades.`,
            })
        }

        // =============================== Validación 5 — Verificar precio ===============================
        if (precio !== undefined && parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: `El producto "${nombre}" debe tener un precio mayor a 0.`,
            })
        }

        // =============================== Manejar Imagen ===============================
        const nombreImagen = req.file.filename;
        if (imagen !== undefined) {
            const rutaImagenAnterior = path.join(__dirname, '../uploads', producto.imagen);
            try {
                await fs.unlink(rutaImagenAnterior);
            } catch (error) {
                console.error('Error al eliminar la imagen subida: ', error)
            }
            producto.imagen = nombreImagen;
        }
        // =============================== Actualizar campos ===============================
        if (nombre !== undefined) producto.nombre = nombre;
        if (descripcion !== undefined) producto.descripcion = descripcion;
        if (activo !== undefined) producto.activo = activo;
        if (categoriaId !== undefined) producto.categoriaId = categoriaId;
        if (subCategoriaId !== undefined) producto.subCategoriaId = subCategoriaId;
        if (stock !== undefined) producto.stock = parseInt(stock);
        if (precio !== undefined) producto.precio = parseFloat(precio);

        if (!producto.activo) {
            return res.status(400).sjon({
                success: false,
                message: 'El Producto no esta activo'
            })
        }

        // =============================== Guardar cambios ===============================
        await producto.save();

        // =============================== Respuesta exitosa =============================== 
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: {
                producto
            }
        });
    } catch (error) {
        console.log('Error en actualizarProducto: ', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación.',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar el producto',
            error: error.message
        })
    }
};

/**
 * ACTIVAR Y/O DESACTIVAR PRODUCTO
 * ====================================================================
 * PATCH / api / admin / productos / :id / estado
 * 
 * Se desactiva el producto
 * 
 * @param {Object} req - request express
 * @param {Object} res - responde express
 */
const toggleProducto = async (req, res) => {
    try {
        const { id } = req.params;

        // =============================== Buscar Producto ===============================
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(400).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // =============================== Alternar estado activo ===============================
        const nuevoEstado = !producto.activo;
        producto.activo = nuevoEstado;

        // =============================== Guardar cambios ===============================
        await producto.save();

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            message: `Producto cambio al estado ${nuevoEstado ? 'activo' : 'desactivado'} de forma exitosa.`,
            data: {
                productosAfectados
            }
        });

    } catch (error) {
        console.error('Error en toggleProducto: ', error);

        if (req.file) {
            const rutaImagen = path.join(__dirname, '../uploads', producto.imagen);
            try {
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error('Error al eliminar la imagen subida: ', err)
            }
        }
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de producto',
            error: error.message
        });
    }
};


export default {
    obtenerProductos,
    obtenerProductosById,
    actualizarProducto,
    toggleProducto,
    obtenerProductosDestacados,
    obtenerCategorias,
    obtenerSubCategorias,                                                                                                                                   
};
