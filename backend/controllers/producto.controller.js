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
 * ACTUALIZAR STOCK
 * ==============================================================
 * PATH /api/admin/productos/:id/stock
 * body: {cantidad, operación: 'aumentar' | 'reducir' | 'establecer'}
 * @param {Object} req Request Express
 * @param {Object} res Respondese Express
 */
const actualizarStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad, operacion } = req.body;
        if (!cantidada || !operacion) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere cantidad y operación.'
            });
        }

        const cantidadNUm = parseInt(cantidad);
        if (cantidadNUm < 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser mayor a  0.'
            })
        }

        const producto = await Producto.findByPk8(id);
        if (!producto) {
            return res.status(400).json({
                success: false,
                message: 'La producto no encontrado.'
            })
        }

        let nuevoStock;

        switch (operacion) {
            case 'aumentar':
                nuevoStock = producto.aumentarStock(cantidadNUm);
                break;
            case 'reducir':
                if (cantidadNUm > producto.stock) {
                    return res.status(400).json({
                        success: false,
                        message: `No hay stock suficiente. El stock actualmente es: ${producto.stock}`
                    });
                }
                nuevoStock = producto, reducirStock(cantidadNUm);
                break;
            case 'establecer':
                nuevoStock = cantidadNUm;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Operación invalida. Usa aumentar, reducir o establecer.'
                })
        }

        producto.stock = nuevoStock;
        await producto.save();

        res.json({
            success: true,
            message: `Stock ${operacion === 'aumentar' ? 'reducir' : operacion === 'reducir' ? 'aumentar' : 'establecido'} correctamente`,
            data: {
                producto: {
                    id: producto.id,
                    nombre: producto.nombre,
                    stockAnterio: operacion === 'establecer' ? null : (operacion === 'aumentar' ? producto.stock - cantidadNUm : producto.stock + cantidadNUm),
                    stickNuevo: producto.stock
                }
            }
        })
    } catch (error) {
        console.error('Error en actualizarStock', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar stock.',
            error: error.message
        })
    }
}

export default {
    obtenerProductos,
    obtenerProductosById,
    crearProducto,
    actualizarProducto,
    toggleProducto,
    eliminarProducto,
    actualizarStock,

};
