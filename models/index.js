// ------------------------------------------------------------
// Relaciones entre modelos
// ------------------------------------------------------------
const Categoria = require('./Categoria');
const Genero = require('./Genero');
const Actor = require('./Actor');
const Contenido = require('./Contenido');
const ContenidoGenero = require('./ContenidoGenero');
const ContenidoActor = require('./ContenidoActor');

// Una categoría tiene muchos contenidos; cada contenido pertenece a una categoría
Categoria.hasMany(Contenido, { foreignKey: 'id_categoria' });
Contenido.belongsTo(Categoria, { foreignKey: 'id_categoria' });

// Contenido <-> Genero (muchos a muchos) a través de contenido_generos
Contenido.belongsToMany(Genero, {
  through: ContenidoGenero,
  foreignKey: 'id_contenido',
  otherKey: 'id_genero',
});
Genero.belongsToMany(Contenido, {
  through: ContenidoGenero,
  foreignKey: 'id_genero',
  otherKey: 'id_contenido',
});

// Contenido <-> Actor (muchos a muchos) a través de contenido_actores
Contenido.belongsToMany(Actor, {
  through: ContenidoActor,
  foreignKey: 'id_contenido',
  otherKey: 'id_actor',
});
Actor.belongsToMany(Contenido, {
  through: ContenidoActor,
  foreignKey: 'id_actor',
  otherKey: 'id_contenido',
});

module.exports = {
  Categoria,
  Genero,
  Actor,
  Contenido,
  ContenidoGenero,
  ContenidoActor,
};
