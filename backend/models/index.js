/**
 * Asociaciones entre modulos
 * este archivo define todas las relaciones entre modelos de sequelize
 * deja ejecutar después de importar los modelos
 */

// Importar todos los modelos
const Usuario = require('./usuario');
const Categoria = require('./categoria');
const Carrito = require('./carrito');
const SubCategoria = require('./subCategoria');
const Producto = require('./Producto');
const DetallePedido = require('./detallePedido');
const Pedido = require('./pedido');

/**
 * Definir asociaciones
 * Tipos de relaciones sequelize:
 * 
 * hasone 1 - 1
 * belongsto 1 - 1
 * hasmary 1 - N
 * belongstomary N - N 
 */

/**
 * Categoria - SubCategoria
 * Una categoria tiene muchas subcategorias
 * Una subcategoria pertenece a unca tegoria
 */
Categoria.hasMany(SubCategoria, { 
    foreignKey: 'categoriaId', // Campo que conecta las tablas 
    as: 'subcategorias', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina una categoria, se elimina subcategoria
    onUpdate: 'CASCADE', // Si se actualiza categoria actualizar subcategorias
});

SubCategoria.belongsTo(Categoria, { 
    foreignKey: 'categoriaId', // Campo que conecta las tablas 
    as: 'categoria', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina una categoria, se elimina subcategoria
    onUpdate: 'CASCADE', // Si se actualiza categoria actualizar subcategorias
});

/**
 * Categoria - Producto
 * Una categoria tiene muchas productos
 * un producto pertecene a una categoria
 */
Categoria.hasMany(Producto, { 
    foreignKey: 'categoriaId', // Campo que conecta las tablas 
    as: 'productos', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina una categoria, se elimina producto
    onUpdate: 'CASCADE', // Si se actualiza categoria actualizar producto
});

Producto.belongsTo(Categoria, { 
    foreignKey: 'categoriaId', // Campo que conecta las tablas 
    as: 'categoria', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina una categoria, se elimina prodcuto
    onUpdate: 'CASCADE', // Si se actualiza categoria actualizar el producto
});

/**
 * SubCategoria - Producto
 * Una subcategoria tiene muchas productos
 * un producto pertecene a una categoria
 */
SubCategoria.hasMany(Producto, { 
    foreignKey: 'subCategoriaId', // Campo que conecta las tablas 
    as: 'productos', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina una sibcategoria, se elimina producto
    onUpdate: 'CASCADE', // Si se actualiza subcategoria actualizar producto
});

Producto.belongsTo(SubCategoria, { 
    foreignKey: 'subCategoriaId', // Campo que conecta las tablas 
    as: 'categoria', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina una subcategoria, se elimina prodcuto
    onUpdate: 'CASCADE', // Si se actualiza subcategoria actualizar el producto
});

/**
 * Usuario - Carrito
 * Una usuario tiene muchos carritos
 * Un carrito pertence a un usuario
 */
Usuario.hasMany(Carrito, { 
    foreignKey: 'usuarioId', // Campo que conecta las tablas 
    as: 'carritos', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina un usuario, se elimina carrito
    onUpdate: 'CASCADE', // Si se actualiza usuario actualizar carrito
});

Carrito.belongsTo(Usuario, { 
    foreignKey: 'usuarioId', // Campo que conecta las tablas 
    as: 'usuario', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina un usuario, se elimina carrito
    onUpdate: 'CASCADE', // Si se actualiza usuario actualizar carrito
});

/**
 * Carrito - Producto
 * Un carrito tiene muchos productos
 * Un producto pertence a un carrito
 */
Carrito.hasMany(Producto, { 
    foreignKey: 'carritoId', // Campo que conecta las tablas 
    as: 'productos', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina un carrito, se elimina producto
    onUpdate: 'CASCADE', // Si se actualiza carrito actualizar producto
});

Producto.belongsTo(Carrito, { 
    foreignKey: 'carritoId', // Campo que conecta las tablas 
    as: 'carrito', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina un carrito, se elimina producto
    onUpdate: 'CASCADE', // Si se actualiza carrito actualizar el producto
});

/**
 * Usuario - Pedido
 * Un usuario tiene muchos pedidos
 * Un pedido pertence a un usuario
 */
Usuario.hasMany(Pedido, { 
    foreignKey: 'usuarioId', // Campo que conecta las tablas 
    as: 'pedidos', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina un usuario, se elimina pedido
    onUpdate: 'CASCADE', // Si se actualiza usuario actualizar pedido
});

Pedido.belongsTo(Usuario, { 
    foreignKey: 'usuarioId', // Campo que conecta las tablas 
    as: 'usuario', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina una subcategoria, se elimina prodcuto
    onUpdate: 'CASCADE', // Si se actualiza subcategoria actualizar el producto
});

/**
 * Pedido - DetallePedido
 * Un Pedido tiene muchos detalle de pedido
 * Un DetallePedido pertence a un Pedido
 */
Pedido.hasMany(DetallePedido, { 
    foreignKey: 'pedidoId', // Campo que conecta las tablas 
    as: 'detallesPedido', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina un pedido, se elimina detallePedido
    onUpdate: 'CASCADE', // Si se actualiza pedido actualizar detallesPedido
});

DetallePedido.belongsTo(Pedido, { 
    foreignKey: 'pedidoId', // Campo que conecta las tablas 
    as: 'pedido', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina un pedido, se elimina detallePedido
    onUpdate: 'CASCADE', // Si se actualiza pedido actualizar el detallePedido
});

/**
 * Producto - DetallePedido
 * Un Producto puede estar en muchos detallesPedido
 * Un DetallePedido pertence a un Producto
 */
Producto.hasMany(DetallePedido, { 
    foreignKey: 'productoId', // Campo que conecta las tablas 
    as: 'detallesPedido', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina un producto, se elimina detallePedido
    onUpdate: 'CASCADE', // Si se actualiza producto actualizar detallesPedido
});

DetallePedido.belongsTo(Producto, { 
    foreignKey: 'productoId', // Campo que conecta las tablas 
    as: 'producto', // ALias para la relacion
    onDelete: 'CASCADE', // Si se elimina un producto, se elimina detallePedido
    onUpdate: 'CASCADE', // Si se actualiza producto actualizar el detallePedido
});

/**
 * Relaciones muchos a muchos
 * pedido y producto tiene una relación de muchos a muchos a través de detalle pedido
 */

Pedido.belongsToMany(Producto, { 
    through: DetallePedido, // Tabla intermedia
    foreignKey: 'pedidoId', // FK en la tabla intermedia
    otherKey: 'productoId', // FK del otro lado
    as: 'productos', // Alias para la relación
});

Producto.belongsToMany(Pedido, { 
    through: DetallePedido, // Tabla intermedia
    foreignKey: 'productoId', // FK en la tabla intermedia
    otherKey: 'pedidoId', // FK del otro lado
    as: 'pedidos', // Alias para la relación
});

/**
 * Exportar funciones de inicialización
 * Funcio para inicializar todas las asociaciones
 * Se llama desde server.js después de cargar los modelos
 */
module.exports = {
    Usuario,
    Categoria,
    SubCategoria,
    Producto,
    Carrito,
    Pedidod,
    DetallePedido,
    initializeAssociations
};

