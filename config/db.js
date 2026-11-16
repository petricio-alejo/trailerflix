// ------------------------------------------------------------
// Conexión a MySQL con Sequelize
// ------------------------------------------------------------
require('dotenv').config();
const Sequelize = require('sequelize');

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  define: { timestamps: false },
  logging: false, // no mostramos cada consulta SQL por consola
});

// Verifica que la conexión funcione. Devuelve true o false
// para que server.js decida si levanta o no el servidor.
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente.');
    return true;
  } catch (error) {
    console.error('No se pudo conectar a MySQL:', error);
    return false;
  }
}

// Cierra la conexión (se usa al apagar el servidor)
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('Conexión cerrada correctamente.');
  } catch (error) {
    console.error('Error al cerrar la conexión:', error);
  }
}

module.exports = { sequelize, testConnection, closeConnection };
