/**
 *  CONTROLADORES DE PRODUCTO
 * ====================================================================
 * Maneja las operaciones CRUD y activar y desactivar producto
 * Solo accesible por administradores
 */

/**
 *  IMPORTAR MODELOS
 * ====================================================================*/
const SubCategoria = require('../models/subCategoria.js');
const Categoria = require('../models/categoria.js');
const Producto = require('../models/producto.js');

/**
 *  IMPORTAR PATH Y FS PARA MANEJAR ARCHIVOS
 * ====================================================================*/
const path = require('path'); // Encontrar archivo
const fs = require('fs'); // La función de escribir dentro de las carpetas o sacar, directamente

/**
 *  OBTENER TODOS LOS PRODUCTOS 
 * ====================================================================
 * Query params:
 * - categoriaId - Filtrar por el id de las categorias
 * - subCategoriaId - Filtrar el el id entre todas las subCategorias
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerProductos = async (req, res) => {
    try {
        const { 
            categoriaId, 
            subCategoriaId, 
            activo, 
            incluirSubCategorias, 
            incluirCategorias, 
            conStock, 
            buscar, 
            pagina = 1, 
            limite = 120 
        } = req.query;

        // =============================== Construir filtros ===============================
        const where = {};
        
        if (categoriaId) where.categoriaId = categoriaId;
        if (subCategoriaId) where.subCategoriaId = subCategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (conStock !== undefined) where.stock = { [Op.gt]: 0 };
        if (buscar) {
            where[Op.or] = [
                { nombre: { [Op.iLike]: `%${buscar}%` } },
                { descripcion: { [Op.iLike]: `%${buscar}%` } }
            ];
        }

        // =============================== Paginacion ===============================
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        // =============================== Opciones de consulta ===============================
        const include = [];
        
        if (incluirCategorias === 'true') {
            include.push({
                model: Categoria,
                as: 'Categoria',
                attributes: ['id', 'nombre', 'activo']
            });
        }
        
        if (incluirSubCategorias === 'true') {
            include.push({
                model: SubCategoria,
                as: 'SubCategoria',
                attributes: ['id', 'nombre', 'activo']
            });
        }

        const opciones = {
            where,
            include,
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
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
 * OBTENER PRODUCTO POR ID
 * ====================================================================
 * GET /api/admin/producto/:id
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const obtenerProductosById = async (req, res) => {
    try {
        const { id } = req.params;

        // =============================== Busca producto con relación ===============================
        const producto = await Producto.findByPk(id, {
            include: [
                {
                    model: Categoria,
                    as: 'Categoria',
                    attributes: ['id', 'nombre', 'activo']
                },
                {
                    model: SubCategoria,
                    as: 'SubCategoria',
                    attributes: ['id', 'nombre', 'activo']
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
 * CREAR PRODUCTO
 * ====================================================================
 * POST /api/admin/productos
 * Body: {nombre, descripcion, precio, stock, subCategoriaId, categoriaId}
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
                message: 'Todos los campos son requeridos: nombre, precio, stock, subCategoriaId, categoriaId'
            });
        }

        // =============================== Validación 2 — Verificar que la categoriaId exista ===============================
        const categoria = await Categoria.findByPk(categoriaId);
        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: `La categoria con id "${categoriaId}" no existe.`,
            });
        }

        // =============================== Validación 3 — Verificar que la categoria este activa ===============================
        if (!categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La categoria "${categoria.nombre}" no esta activa.`,
            });
        }

        // =============================== Validación 4 — Verificar que la subcategoria exista ===============================
        const subCategoria = await SubCategoria.findByPk(subCategoriaId);
        if (!subCategoria) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria con id "${subCategoriaId}" no existe.`,
            });
        }

        // =============================== Validación 5 — Verificar que la subcategoria este activa ===============================
        if (!subCategoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria "${subCategoria.nombre}" no esta activa.`,
            });
        }

        // =============================== Validación 6 — Verificar que la subcategoria esta vinculada a una categoria ===============================
        if (subCategoria.categoriaId !== parseInt(categoriaId)) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria "${subCategoria.nombre}" no esta vinculada a la categoria "${categoria.nombre}".`,
            });
        }

        // =============================== Validación 7 — Verificar que el stock sea válido ===============================
        if (parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: `El stock debe ser mayor o igual a 0.`,
            });
        }

        // =============================== Validación 8 — Verificar que el precio sea válido ===============================
        if (parseFloat(precio) <= 0) {
            return res.status(400).json({
                success: false,
                message: `El precio debe ser mayor a 0.`,
            });
        }

        // =============================== Obtener imagen ===============================
        const imagen = req.file ? req.file.filename : null;

        // =============================== Crear producto ===============================
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion: descripcion || null,
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
                as: 'Categoria',
                attributes: ['id', 'nombre']
            },
            {
                model: SubCategoria,
                as: 'SubCategoria',
                attributes: ['id', 'nombre']
            }]
        });

        // =============================== Respuesta exitosa ===============================
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente.',
            data: {
                producto: nuevoProducto
            }
        });

    } catch (error) {
        console.error('Error en crearProducto: ', error);

        // Si hubo un error, eliminar la imagen subida
        if (req.file) {
            const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
            try {
                fs.unlinkSync(rutaImagen);
            } catch (err) {
                console.error('Error al eliminar la imagen subida: ', err);
            }
        }
        
        if (error.name === 'SequelizeValidationError') {
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
 * PUT /api/admin/productos/:id
 * body: {nombre, descripcion, precio, stock, categoriaId, subCategoriaId, activo}
 * 
 * @param {Object} req - request express
 * @param {Object} res - responde express
 */
const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, stock, categoriaId, subCategoriaId, activo } = req.body;

        // =============================== Buscar producto ===============================
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // =============================== Validación 1 — Verificar categoria ===============================
        if (categoriaId && categoriaId !== producto.categoriaId) {
            const categoria = await Categoria.findByPk(categoriaId);

            if (!categoria || !categoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: 'Categoria invalida o inactiva',
                });
            }
        }

        // =============================== Validación 2 — Verificar subcategoria ===============================
        if (subCategoriaId && subCategoriaId !== producto.subCategoriaId) {
            const subCategoria = await SubCategoria.findByPk(subCategoriaId);

            if (!subCategoria || !subCategoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: 'Subcategoria invalida o inactiva',
                });
            }

            // =============================== Validación 3 — Verificar que subcategoria pertenezca a la categoria ===============================
            const catId = categoriaId || producto.categoriaId;
            if (subCategoria.categoriaId !== parseInt(catId)) {
                return res.status(400).json({
                    success: false,
                    message: 'La subcategoria no pertenece a la categoria seleccionada.',
                });
            }
        }

        // =============================== Validación 4 — Verificar stock ===============================
        if (stock !== undefined && parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: `El stock debe ser mayor o igual a 0.`,
            });
        }

        // =============================== Validación 5 — Verificar precio ===============================
        if (precio !== undefined && parseFloat(precio) <= 0) {
            return res.status(400).json({
                success: false,
                message: `El precio debe ser mayor a 0.`,
            });
        }

        // =============================== Manejar Imagen ===============================
        if (req.file) {
            const nombreImagen = req.file.filename;
            
            // Eliminar imagen anterior si existe
            if (producto.imagen) {
                const rutaImagenAnterior = path.join(__dirname, '../uploads', producto.imagen);
                try {
                    if (fs.existsSync(rutaImagenAnterior)) {
                        fs.unlinkSync(rutaImagenAnterior);
                    }
                } catch (error) {
                    console.error('Error al eliminar la imagen anterior: ', error);
                }
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
        console.error('Error en actualizarProducto: ', error);

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
        });
    }
};

/**
 * ACTIVAR Y/O DESACTIVAR PRODUCTO
 * ====================================================================
 * PATCH /api/admin/productos/:id/estado
 * 
 * @param {Object} req - request express
 * @param {Object} res - responde express
 */
const alterarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        // =============================== Buscar Producto ===============================
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
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
            message: `Producto ${nuevoEstado ? 'activado' : 'desactivado'} de forma exitosa.`,
            data: {
                producto: {
                    id: producto.id,
                    nombre: producto.nombre,
                    activo: producto.activo
                }
            }
        });

    } catch (error) {
        console.error('Error en alterarProducto: ', error);
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
 * DELETE /api/admin/productos/:id
 * 
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
            });
        }

        // =============================== Eliminar imagen si existe ===============================
        if (producto.imagen) {
            const rutaImagen = path.join(__dirname, '../uploads', producto.imagen);
            try {
                if (fs.existsSync(rutaImagen)) {
                    fs.unlinkSync(rutaImagen);
                }
            } catch (error) {
                console.error('Error al eliminar la imagen del producto: ', error);
            }
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
        });
    }
};

/**
 * ACTUALIZAR STOCK
 * ==============================================================
 * PATCH /api/admin/productos/:id/stock
 * body: {cantidad, operacion: 'aumentar' | 'reducir' | 'establecer'}
 * @param {Object} req Request Express
 * @param {Object} res Response Express
 */
const actualizarStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad, operacion } = req.body;
        
        if (!cantidad || !operacion) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere cantidad y operación.'
            });
        }

        const cantidadNum = parseInt(cantidad);
        if (cantidadNum < 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser mayor o igual a 0.'
            });
        }

        const producto = await Producto.findByPk(id);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado.'
            });
        }

        let nuevoStock;
        let stockAnterior = producto.stock;

        switch (operacion) {
            case 'aumentar':
                nuevoStock = producto.stock + cantidadNum;
                break;
            case 'reducir':
                if (cantidadNum > producto.stock) {
                    return res.status(400).json({
                        success: false,
                        message: `No hay stock suficiente. El stock actual es: ${producto.stock}`
                    });
                }
                nuevoStock = producto.stock - cantidadNum;
                break;
            case 'establecer':
                nuevoStock = cantidadNum;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Operación inválida. Usa aumentar, reducir o establecer.'
                });
        }

        producto.stock = nuevoStock;
        await producto.save();

        res.json({
            success: true,
            message: `Stock ${operacion === 'aumentar' ? 'aumentado' : operacion === 'reducir' ? 'reducido' : 'establecido'} correctamente`,
            data: {
                producto: {
                    id: producto.id,
                    nombre: producto.nombre,
                    stockAnterior: stockAnterior,
                    stockNuevo: producto.stock
                }
            }
        });
    } catch (error) {
        console.error('Error en actualizarStock:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar stock.',
            error: error.message
        });
    }
};

// =============================== EXPORTAR MÓDULOS ===============================
// Verificar que todas las funciones están definidas antes de exportarlas
if (typeof obtenerProductos !== 'function') console.error('Error: obtenerProductos no es una función');
if (typeof obtenerProductosById !== 'function') console.error('Error: obtenerProductosById no es una función');
if (typeof crearProducto !== 'function') console.error('Error: crearProducto no es una función');
if (typeof actualizarProducto !== 'function') console.error('Error: actualizarProducto no es una función');
if (typeof alterarProducto !== 'function') console.error('Error: alterarProducto no es una función');
if (typeof eliminarProducto !== 'function') console.error('Error: eliminarProducto no es una función');
if (typeof actualizarStock !== 'function') console.error('Error: actualizarStock no es una función');

// Exportar usando CommonJS
module.exports = {
    obtenerProductos,
    obtenerProductosById,
    crearProducto,
    actualizarProducto,
    alterarProducto,
    eliminarProducto,
    actualizarStock
};