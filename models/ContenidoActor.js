const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla intermedia contenido_actores (PK compuesta)
const ContenidoActor = sequelize.define('ContenidoActor', {
  id_contenido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  id_actor: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
}, {
  tableName: 'contenido_actores',
  timestamps: false,
});

module.exports = ContenidoActor;
