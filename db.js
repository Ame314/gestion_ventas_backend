const mysql = require('mysql2');
require('dotenv').config();  // Para cargar las variables de entorno desde .env

// Crear la conexión con la base de datos
const connection = mysql.createConnection({
  host: 'localhost',  // O usa la IP del contenedor si es necesario
  port: 3307,         // El puerto expuesto de tu contenedor
  user: 'root',       // Usuario que configuraste
  password: '1234',   // Contraseña que configuraste
  database: 'gestion_ventas'  // Nombre de la base de datos
});

// Verificar que la conexión fue exitosa
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a la base de datos con el ID:', connection.threadId);
});

// Exportar la conexión para usarla en otros archivos
module.exports = connection;