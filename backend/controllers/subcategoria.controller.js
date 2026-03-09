/**
 *  CONTROLADORES DE SUBCATEGORIA
 * ====================================================================
 * Maneja las operaciones CRUD y acvtivar y desactivar sub-categoria
 * Solo accesible por administradores
 */

/**
 *  IMPORTAR MODELOS
 * ====================================================================*/
const Categoria = require('../models/categoria');
const SubCategoria = require('../models/subCategoria');
const Producto = require('../models/producto');

/**
 *  OBTENER TODAS LAS SUBCATEGORIAS 
 * ====================================================================
 * Query params:
 * 
 * - Activo true/false (filtrar por estado)
 * - incluirCategoria true/false (incluir categoria relacionada)
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 *  */
const getSubCategorias = async (req, res) =>{
    try {
        const {categoriaId, activo, incluirCategoria} = req.query;

// =============================== Opciones de consulta ===============================
        const opciones = {
            order: [['nombre','ASC']] // Ordenar de manera alfabetica
        }

// =============================== Filtros ===============================
        const where ={};
        if (categoriaId) where.categoriaId = categoriaId;
        if (activo !== undefined) where.activo = activo === 'true';

        if (Object.keys(where).length > 0) {
            opciones.where = where;
        }

// =============================== Incluir categoria si se solicita ===============================
        if (incluirCategoria == 'true') {
            opciones.include = [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre', 'activo']
            }]
        }
      
// =============================== Obtener categoria ===============================
         
        const subCategorias = await SubCategoria.findAll(opciones);

// =============================== Respuesta exitosa ===============================
        res.json ({
            success: true,
            count: subCategorias.length,
            data: {subCategorias}
        });
        
    } catch (error) {
        console.error('Error en getSubCategorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las subcategorías',
            error: error.message
        })
    }
}

/**
 * OBTENER EL ID DE LA SUBCATEGORIA
 * ====================================================================
 * GET / api / categoria/:id
 * 
 * - Activo true/false (filtrar por estado)
 * - incluirsubcategorias true/false (incluir subcategoria relacionadas)
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const getSubCategoriasById = async (req, res) =>{
    try {
        const {id} = req.params;

// =============================== Busca categorias con SubCategorias y contar productos ===============================
        const subCategoria = await SubCategoria.findByPk (id, {
            include: [
            {
                model: Producto,
                as: 'productos',
                attributes: ['id']
            }
        ]
        });

        if (!subCategoria) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoría no encontrada'
            });
        }

// =============================== Agregar contador de productos ===============================
        const subCategoriaJSON = subCategoria.toJSON();
        subCategoriaJSON.totalProductos = subCategoriaJSON.productos.length;
        delete subCategoriaJSON.productos; // No enviar la lista completa solo el contador

// =============================== Respuesta exitosa ===============================
        res.json ({
            success: true,
            data: subCategoriaJSON
        });
        
    } catch (error) {
        console.error('Error en getSubCategoriasById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la subcategoría',
            error: error.message
        })
    }
};

/**
 * CREAR SUBCATEGORIA
 * ====================================================================
 * POST / aip / admin / categorias
 * Body: {nombre,descripcion}
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */
const crearSubCategoria = async (req, res) => {
    try {
        const {nombre, descripcion, categoriaId} = req.body;

// =============================== Validación 1 — Verificar campos requeridos ===============================

        if (!nombre || !categoriaId) {
            return res.status(400).json({
                success: false,
                message: 'El nombre y el ID de la categoría son requeridos'
            });
        }

// =============================== Validación 2 — Verificar que el nombre no existia ===============================
        const subCategoriaExistente = await SubCategoria.findOne({where : {nombre, categoriaId}});

        if (subCategoriaExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe una subcategoría con el nombre "${nombre}" en esta categoría`,
            });
        }

//=============================== Validación 3 — Verificar que no exista la misma categoria ===============================
        const categoria = await Categoria.findByPk(categoriaId);

        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: `No existe la categoría con id: "${categoriaId}"`,
            });
        }

// =============================== Validación 4 — Verificar que no exista la misma categoria ===============================
        if (!categoria.activo ) {
            return res.status(400).json({
                success: false,
                message: `La categoría "${categoria.nombre}" no está activa.`,
            });
        }
             
// =============================== Crear categoria ===============================
        const nuevaSubCategoria = await SubCategoria.create ({
            nombre,
            descripcion: descripcion || null, // Si no se proporciona la descripcion se establece como null
            categoriaId,
            activo: true
        });

// =============================== Obtener la subcategoria con los datos de la categoria ===============================
        const subCategoriaConCategoria = await SubCategoria.findByPk(nuevaSubCategoria.id, {
            include:[{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }]
        })
        
// =============================== Respuesta exitosa ===============================
        res.status(201).json({
            success: true,
            message: 'SubCategoria creada exitosamente.',
            data: {
                subCategoria: subCategoriaConCategoria
            }
        });

    } catch (error) {
        console.error('Error en crearSubCategoria: ', error)
        if (error.name == 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
        });
    }

            res.status(500).json({
                success: false,
                message: 'Error al crear la subcategoría',
                error: error.message
            });
        }
};
/**
 * ACTUALIZAR SUBCATEGORIA
 * ====================================================================
 * PUT / api / admin / subcategorias / :id
 * body: {nombre, descripcion}
 * 
 * @param {Object} req - request express
 * @param {Object} res - responde express
 */
const actualizarSubCategoria = async (req,res) => {
    try {
        const {id} = req.params;
        const {nombre, descripcion, activo, categoriaId} = req.body;

// =============================== Buscar subcategoria ===============================
        const subCategoria = await SubCategoria.findByPk(id);

        if (!subCategoria) {
            return res.status(404).json({
                success: false,
                message: 'SubCategoria no encontrada'
            });
        }

// =============================== Validación 1 — Si se cambia el nombre verificar no existe ===============================
        if (nombre && nombre !== subCategoria.nombre) {
            const subCategoriaConMismoNombre = await SubCategoria.findOne({where: {nombre}});

            if (subCategoriaConMismoNombre) {
                return res.status(400).json ({
                    success: false,
                    message: `Ya existe una subcategoria con el mismo nombre "$(nombre)"`,
                })
            }

// =============================== Actualizar campos ===============================
        if (nombre!==undefined) subCategoria.nombre = nombre;
        if (descripcion!==undefined) subCategoria.descripcion = descripcion;
        if (activo!==undefined) subCategoria.activo = activo;
        if (categoriaId !==undefined) subCategoria.categoriaId = categoriaId;

// =============================== Guardar cambios ===============================
        await subCategoria.save();

// =============================== Respuesta exitosa =============================== 
        res.json ({
            success: true,
            message: 'SubCategoria actualizada exitosamente',
            data: {
                subCategoria
            }});
    }
} catch (error) {
    console.log ('Error en actuaizarSubCategoria: ', error);
    
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success:false,
            message:'Error de valiación',
            errors: error.errors.map(e => e.message)
        });
    }

    res.status(500).json({
        success: false,
        message: 'Error al actualizar sub-categoria',
        error: error.message,
    })
}};
/**
 * ACTIVAR Y/O DESACTIVAR SUBCATEGORIA
 * ====================================================================
 * PATCH / api / admin / categorias / :id / estado
 * 
 * Al desativar una categioria se desactiva toddas las suibcategorias relacionadas
 * Al desactivar una subcategoria se desactiva todos los productos relacionados
 * 
 * @param {Object} req - request express
 * @param {Object} res - responde express
 */
const toggleSubCategoria = async (req,res) => {
    try {
        const {id} = req.params;

// =============================== Buscar Categoria ===============================
        const subCategoria = await SubCategoria.findByPk(id);

        if (!subCategoria) {
            return res.status(400).json({
                success: false,
                message: 'Subcategoría no encontrada'
            });
        }

// =============================== Alternar estado activo ===============================
        const nuevoEstado = !subCategoria.activo;
        subCategoria.activo = nuevoEstado;

// =============================== Guardar cambios ===============================
        await subCategoria.save();

// =============================== Contar cuantos registros se afectaron ===============================
        const productosAfectados = await Producto.count({where: {subCategoriaId : id}});

// =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            message: `Subcategoría cambió al estado ${nuevoEstado ? 'activo' : 'desactivado'} de forma exitosa.`,
            data: {
                subCategoria,
                productosAfectados
            }
        });

        } catch (error) {
            console.error('Error en toggleSubCategoria: ', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado de subcategoría',
                error: error.message
            });
        }
};
    
/**
 * ELIMINAR SUBCATEGORIA
 * ====================================================================
 * DELETE  /api/admin/categorias/:id
 * 
 * Solo permite eliminar si no tiene subcategorias ni productos relacionados
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 */
const eliminarSubCategoria = async (req, res) => {
    try {
        const {id} = req.params;
// =============================== Buscar categoria ===============================
        const subCategoria = await SubCategoria.findByPk(id);
        if (!subCategoria) {
            return res.status(404).json({
                success: false,
                message: "Subcategoría no encontrada"
            })
        }

// =============================== Validación 1 — Verificar que no tenga productos ===============================
        const productos = await Producto.count ({
            where: {subCategoriaId: id}
        });

        if (productos > 0 ) {
            return res.status(400).json ({
                success: false,
                message: `No se puede eliminar la subcategoría porque tiene ${productos} productos asociados. Usa PATCH /api/admin/subcategorias/:id/status para desactivar en lugar de eliminar.`
            })
        }

// =============================== Eliminar categoria ===============================
        await subCategoria.destroy();

// =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            message: 'Subcategoría eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error en eliminarSubCategoria: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la subcategoría',
            error: error.message
        })
    }
};

/**
 * OBTENER LAS ESTADISTICAS DE LAS SUBCATEGORIAS
 * ====================================================================
 * GET /api/admin/categoria/:id/estadisticas
 * Retorna
 * Total de subcategorias activas/ inactivas total de productos activos / inactivos calor total del inventario
 * Stack total
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * 
 */
const getEstadisticasSubCategoria = async (req,res) => {
    try {
        const {id} = req.params;
// =============================== Verficar que la sub-categoria exista ===============================
            const subCategoria = await SubCategoria.findByPk(id, {
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }]
        });
        if (!subCategoria) {
            return res.status(404).json({
                success: false,
                message: "Subcategoría no encontrada."
            })};

// =============================== Contar productos ===============================
        const totalProductos = await Producto.count({
            where: {subCategoriaId: id}
        });
        const productosActivos = await Producto.count({
            where: {subCategoriaId: id, activo: true}
        });

// =============================== Obtener productos para calcular estadisticas ===============================
        const productos = await Producto.findAll({
            where: {subCategoriaId: id},
            attributes: ['precio', 'stock']
        });

// =============================== Calcular estadisticas de inventario ===============================
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
            stockTotal += producto.stock;
        });

// =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            data: {
                subCategoria: {
                    id: subCategoria.id,
                    nombre: subCategoria.nombre,
                    activo: subCategoria.activo,
                    categoria: subCategoria.categoria
                },
                estadisticas: {
                    productos: {
                        total: totalProductos,
                        activos: productosActivos,
                        inactivos: totalProductos - productosActivos,
                    },
                    inventario: {
                        valorTotal: valorTotalInventario.toFixed(2), //quitar decimales,
                        stockTotal
                    }
                }}});

    } catch (error) {
        console.error('Error en getEstadisticasSubCategoria: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de la subcategoría',
            error: error.message
        })
    }
};
    module.exports = {
        getSubCategorias,
        getSubCategoriasById,
        crearSubCategoria,
        actualizarSubCategoria,
        toggleSubCategoria,
        eliminarSubCategoria,
        getEstadisticasSubCategoria
    };
