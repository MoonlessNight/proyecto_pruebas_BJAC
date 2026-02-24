/**
 *  CONTROLADORES DE SUBCATEGORIA
 * ====================================================================
 * Maneja las operaciones CRUD y acvtivar y desactivar sub-categoria
 * Solo accesible por administradores
 */

/**
 *  IMPORTAR MODELOS
 * ====================================================================*/
import Categoria from '../models/categoria.js';
import SubCategoria from '../models/subCategoria.js';
import Producto from '../models/Producto.js';

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
        const {categoriaId, activo, incluirSubCategorias} = req.query;

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
        if (incluirSubCategorias == 'true') {
            opciones.include = {
                model: Categoria,
                as: 'Categorias',
                attributes: ['id', 'nombre', 'activo']
            }
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
            message: 'Error al obtener categoria',
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
        const {id} = req.query;

// =============================== Busca categorias con SubCategorias y contar productos ===============================
        const subCategoria = await SubCategoria.findByPk (id, {
            incluide: [
            {
                model: Producto,
                as: 'producto',
                attributes: ['id']
            }
        ]
        });

        if (!subCategoria) {
            return res.status(404).json({
                success: false,
                message: 'SubCategoria no encontrada'
            });
        }

// =============================== Agregar contador de productos ===============================
        const subCategoriaJSON = subCategoria.toJSON();
        subCategoriaJSON.totalProductos = subCategoriaJSON.Productos.length;
        delete subCategoriaJSON.Productos; // No enviar la lista completa solo el contador

// =============================== Respuesta exitosa ===============================
        res.json ({
            success: true,
            data: subCategoriaJSON
        });
        
    } catch (error) {
        console.error('Error en getCategoriasById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categoria',
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
        const {nombre, descripcion} = req.body;

// =============================== Validación 1 — Verificar campos requeridos ===============================

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoria es requerido'
            });
        }

// =============================== Validación 2 — Verificar que el nombre no existia ===============================
        const subCategoriaExistente = await SubCategoria.findOne({where : {nombre, categoriaId}});

        if (subCategoriaExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe una subcategoria con ese nombre "${nombre}" en esta categoria`,
            });
        }

//=============================== Validación 3 — Verificar que no exista la misma categoria ===============================
        const categoria = await Categoria.findByPk(categoriaId);

        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: `No existe la categoria con id: "${nombre}"`,
            });
        }

// =============================== Validación 4 — Verificar que no exista la misma categoria ===============================
        if (!categoria.activo ) {
            return res.status(400).json({
                success: false,
                message: `La categoria "${nombre}" no esta activa.`,
            });
        }
             
// =============================== Crear categoria ===============================
        const nuevaSubCategoria = await SubCategoria.create ({
            nombre,
            descripcion: descripcion || null, // Si no se propociona la descripcion se establece como nulll
            activo: true
        });

// =============================== Obtener la subcategoria con los datos de la categoria ===============================
        const subCategoriaConCategoria = await SubCategoria.findByPk(nuevaSubCategoria.id, {
            include:[{
                model: Categoria,
                as: 'Categorias',
                attributes: ['id', 'nombre']
            }]
        })
        
// =============================== Respuesta exitosa ===============================
        res.status(201).json({
            success: true,
            message: 'SubCategoria creada exitosamente.',
            data: {
                SubCategoria: subCategoriaConCategoria
            }
        });

    } catch (error) {
        console.error('Error en crearSubCategorias: ', error)
        if (error.name == 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
        });
    }

            res.status(500).json({
                success: false,
                message: 'Error al crear la subcategoria',
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
        const {nombre, descripcion} = req.body;

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
        if (!nuevaSubCategoria.activo) {
            return res.status(400).sjon ({
                success: false,
                message: 'La SubCategoria no esta activa-'
            })
        }

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
        error: error.message
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
                message: 'SubCategoria no encontrada'
            });
        }

// =============================== Alternar estado activo ===============================
        const nuevoEstado = !subCategoria.activo;
        subCategoria.activo = nuevoEstado;

// =============================== Guardar cambios ===============================
        await subCategoria.save();

// =============================== Contar cuantos registros se afectaron ===============================
        const productosAfectados = await Producto.count({where: {categoriaId : id}})

// =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            message: `Subcategoria cambio al estado ${nuevoEstado ? 'activo' : 'desactivado'} de forma exitosa.`,
            data: {
                productosAfectados
            }
        });

        } catch (error) {
            console.error('Error en toggleSubCategoria: ', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado de subcategoria',
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
                message: "Subcategoria no encontrada"
            })
        }

// =============================== Validación 1 — Verificar que no tenga productos ===============================
        const productos = await Producto.count ({
            where: {subCategoriaId: id}
        });

        if (productos > 0 ) {
            return res.status(400).json ({
                success: false,
                message: `No se puede eliminar la subcategoria porque tiene ${productos} productos asociadas. Usa PATCH /api/admin/subcategorias/:id para desactivar en lugar de eliminar.`
            })
        }

// =============================== Eliminar categoria ===============================
        await subCategoria.destroy();

// =============================== Respuesta exitosa ===============================
        res.json({
            success: true,
            message: 'SubCategoria eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error en eliminarSubCategoria: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar subcategoria',
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
            const subCategoria = await SubCategoria.findByPk(id,[{
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }]}]);
        if (!subCategoria) {
            return res.status(404).json({
                success: false,
                message: "Sub-categoria no encontrada."
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
                        stock: stockTotal,
                        valorInventario: valorTotalInventario,
                    },
                    inventario: {
                        valorTotal: valorTotalInventario.toFixed(2), //quitar decimales,
                        stockTotal,
                    }
                }}});

    } catch (error) {
        console.error('Error en getEstadisticasSubCategoria: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas de sub-categoria',
            error: error.message
        })
    }
};
    export default {
        getSubCategorias,
        getSubCategoriasById,
        crearSubCategoria,
        actualizarSubCategoria,
        toggleSubCategoria,
        eliminarSubCategoria,
        getEstadisticasSubCategoria
    };
