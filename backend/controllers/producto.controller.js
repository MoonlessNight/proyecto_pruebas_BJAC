/**
 *  CONTROLADORES DE PRODUCTO
 * ====================================================================
 * Maneja las operaciones CRUD y acvtivar y desactivar producto
 * Solo accesible por administradores
 */

/**
 *  IMPORTAR MODELOS
 * ====================================================================*/
import SubCategoria from '../models/subCategoria.js';
import Categoria from '../models/categoria.js';
import Producto from '../models/Producto.js';

/**
 *  IMPORTAR PATH Y FS PARA MANEJAR ARCHIVOS
 * ====================================================================*/
const path = require('path');
const fs = require('fs');

/**
 *  OBTENER TODOS LOS PRODUCTOS 
 * ====================================================================
 * Query params:
 * 
 * - Activo true/false (filtrar por estado)
 * - incluirCategoria true/false (incluir categoria relacionada)
 * - categoriaId (filtrar por categoria)
 * - subCategoriaId (filtrar por subcategoria)
 * - incluirSubCategorias true/false (incluir subcategoria relacionada) 
 * - incluirCategorias true/false (incluir categoria relacionada)   
 * - conStock true/false (filtrar por stock)
 * - buscar (filtrar por nombre o descripcion)
 * - pagina (paginacion)
 * - limite (paginacion)
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 *  */
const obtenerProductos = async (req, res) => {
    try {
        const { categoriaId, subCategoriaId, activo, incluirSubCategorias, incluirCategorias, conStock, buscar, pagina = 1, limite = 100 } = req.query;

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
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (subCategoriaId) where.subCategoriaId = subCategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (conStock !== undefined) where.stock = { [require('sequelize').Op.gte]: 0 };
        if (buscar) where.nombre = { [require('sequelize').Op.iLike]: `%${buscar}%` };

        if (Object.keys(where).length > 0) {
            opciones.where = where;
        }

        // =============================== Paginacion ===============================
        const offset = (pagina - 1) * limite;
        opciones.limit = limite;
        opciones.offset = offset;

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
            incluide: [
                {
                    model: Producto,
                    as: 'Producto',
                    attributes: ['id']
                },
                {
                    model: SubCategoria,
                    as: 'SubCategoria',
                    attributes: ['id']
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
        })
    }
};

/**
 * CREAR PRODUCTO
 * ====================================================================
 * POST / aip / admin / productos
 * Body: {nombre,descripcion}
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, subCategoriaId, categoriaId } = req.body;

        // =============================== Validación 1 — Verificar campos requeridos ===============================

        if (!nombre || !precio || !stock || !subCategoriaId || !categoriaId) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoria es requerido'
            });
        }

        // =============================== Validación 2 — Verificar la categoriaId exista ===============================
        const categioria = await Categoria.findByPk(categoriaId);
        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: `La categoria con id "${categoriaId}" no existe.`,
            });
        }

        // =============================== Validación 3 — Verificar la categoria este activa ===============================
        if (!categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La categoria "${categoria.nombre}" no esta activa.`,
            });
        }

        // =============================== Validación 4 — Verificar la subcategoria exista ===============================
        const subCategoria = await SubCategoria.findByPk(subCategoriaId);
        if (!subCategoria) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria "${subCategoriaId}" no existe.`,
            });
        }

        // =============================== Validación 5 — Verificar la subcategoria este activa ===============================
        if (!subCategoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria "${subCategoriaId}" no esta activa.`,
            });
        }

        // =============================== Validación 6 — Verificar que la subcategoria esta vinculada a una caegoria ===============================
        if (subCategoria.categoriaId !== parseInt(categoriaId)) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria "${subCategoriaId}" no esta vinculada a la categoria "${categoriaId}".`,
            });
        }

        // =============================== Validación 7 — Verificar que el producto tenga stock ===============================
        const producto = await Producto.findByPk(id);
        if (parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: `El producto "${nombre}" debe ser mayor a 0 unidades.`,
            });
        }

        // =============================== Validación 8 — Verificar que el producto tenga precio ===============================
        if (parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: `El producto "${nombre}" debe tener un precio mayor a 0.`,
            });
        }

        // =============================== Obtener imagen ===============================
        const imagen = req.files ? req.file.filename : null;

        // =============================== Crear producto ===============================
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion: descripcion || null, // Si no se propociona la descripcion se establece como nulll
            precio: parseFloat(precio),
            stock: parseInt(stock),
            subCategoriaId: parseInt(subCategoriaId),
            categoriaId: parseInt(categoriaId),
            imagen,
            activo: true
        });

        // =============================== Recargar con relaciones ===============================
        await nuevoProducto.reload({
            include: [{
                model: Categoria,
                as: 'Categorias',
                attributes: ['id', 'nombre']
            },
            {
                model: SubCategoria,
                as: 'SubCategorias',
                attributes: ['id', 'nombre']
            }
            ]
        });

        // =============================== Respuesta exitosa ===============================
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente.',
            data: {
                Producto: nuevoProducto
            }
        });

    } catch (error) {
        console.error('Error en creaProducto: ', error)

        // Si hubo un error al eliminar la imagen subida
        if (req.file) {
            const rutalImagen = path.join(__dirname, '../updloads', req.file.filename);
            try {
                await fs.unlinkSync(rutalImagen);
            } catch (error) {
                console.error('Error al eliminar la imagen subida: ', error)
            }
        }
        if (error.name == 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion.',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear el producto',
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

        // =============================== Validación 1 — Si se cambia el nombre verificar no existe ===============================
        if (nombre && nombre !== producto.nombre) {
            const productoConMismoNombre = await Producto.findOne({ where: { nombre } });

            if (productoConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una subcategoria con el mismo nombre "$(nombre)"`,
                })
            }

            // =============================== Actualizar campos ===============================
            if (nombre !== undefined) producto.nombre = nombre;
            if (descripcion !== undefined) producto.descripcion = descripcion;
            if (activo !== undefined) producto.activo = activo;
            if (categoriaId !== undefined) producto.categoriaId = categoriaId;
            if (subCategoriaId !== undefined) producto.subCategoriaId = subCategoriaId;
            if (stock !== undefined) producto.stock = stock;
            if (precio !== undefined) producto.precio = precio;
            if (imagen !== undefined) producto.imagen = imagen;
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
        }
    } catch (error) {
        console.log('Error en actuaizarSubCategoria: ', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de valiación',
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
 * Al desativar un producto se desactiva todos los productos relacionados
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

        // =============================== Contar cuantos registros se afectaron ===============================
        const productosAfectados = await Producto.count({ where: { categoriaId: id } })

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
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de producto',
            error: error.message
        });
    }
};

/**
 * ELIMINAR PRODUCTO
 * ====================================================================
 * DELETE  /api/admin/productos/:id
 * 
 * Solo permite eliminar si no tiene subcategorias ni productos relacionados
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 */
const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        // =============================== Buscar Producto ===============================
        const producto = await Producto.findByPk(id);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: "Producto no encontrado"
            })
        }

        // =============================== Validación 1 — Verificar que no tenga productos ===============================
        const productos = await Producto.count({
            where: { productoId: id }
        });

        if (productos > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar el producto porque tiene ${productos} productos asociadas. Usa PATCH /api/admin/productos/:id para desactivar en lugar de eliminar.`
            })
        }

        // =============================== Eliminar Producto ===============================
        await producto.destroy();

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error en eliminarProducto: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: error.message
        })
    }
};

/**
 * OBTENER LAS ESTADISTICAS DE LOS PRODUCTOS
 * ====================================================================
 * GET /api/admin/producto/:id/estadisticas
 * Retorna
 * Total de productos activos/ inactivos calor total del inventario
 * Stack total
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * 
 */
const getEstadisticasProducto = async (req, res) => {
    try {
        const { id } = req.params;
        // =============================== Verficar que el producto exista ===============================
        const producto = await Producto.findByPk(id, [{
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }]
        }]);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: "Producto no encontrado."
            })
        };

        // =============================== Contar productos ===============================
        const totalProductos = await Producto.count({
            where: { id: id }
        });
        const productosActivos = await Producto.count({
            where: { id: id, activo: true }
        });

        // =============================== Obtener productos para calcular estadisticas ===============================
        const productos = await Producto.findAll({
            where: { id: id },
            attributes: ['precio', 'stock']
        });

        // =============================== Calcular estadisticas de inventario ===============================
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
        });

        // =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            data: {
                producto: {
                    id: producto.id,
                    nombre: producto.nombre,
                    activo: producto.activo,
                    categoria: producto.categoria
                },
                estadisticas: {
                    productos: {
                        total: totalProductos,
                        activos: productosActivos,
                        inactivos: totalProductos - productosActivos,
                        stock: stockTotal,
                        valorInventario: valorTotalInventario,
                    },
                    inventario: {
                        valorTotal: valorTotalInventario.toFixed(2), //quitar decimales,
                        stockTotal,
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error en getEstadisticasProducto: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas de producto',
            error: error.message
        })
    }
};
export default {
    obtenerProductos,
    obtenerProductosById,
    crearProducto,
    actualizarProducto,
    toggleProducto,
    eliminarProducto,
    getEstadisticasProducto
};
