const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla actores
const Actor = sequelize.define('Actor', {
  id_actor: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'actores',
  timestamps: false,
  // Nombres en español para las asociaciones (ej: contenido.Actores)
  name: { singular: 'Actor', plural: 'Actores' },
});

module.exports = Actor;
