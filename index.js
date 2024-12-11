// Importar dependencias
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
require('dotenv').config(); 

// Crear la conexión con la base de datos
const connection = mysql.createConnection({
  host: 'localhost',  
  port: 3307,         // Puerto del contenedor
  user: 'root',       // Usuario de tu base de datos
  password: '1234',   // Contraseña de tu base de datos
  database: 'gestion_ventas' // Nombre de la base de datos
});

// Verificar la conexión a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a la base de datos con el ID:', connection.threadId);
});

// Crear la aplicación Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// -----------------------
// Rutas API
// -----------------------

// Ruta principal (Página bonita)
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Gestión de Ventas</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f3f4f6;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          h1 {
            color: #4CAF50;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .section {
            margin-bottom: 20px;
            padding: 20px;
            background: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }
          button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
          }
          button:hover {
            background-color: #45a049;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table, th, td {
            border: 1px solid #ddd;
          }
          th, td {
            padding: 10px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Gestión de Ventas</h1>

          <!-- Productos -->
          <div class="section">
            <h2>Productos</h2>
            <table id="productos-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
            <h3>Agregar Producto</h3>
            <form id="agregar-producto-form">
              <input type="text" id="nombre" placeholder="Nombre" required>
              <input type="text" id="descripcion" placeholder="Descripción" required>
              <input type="number" id="precio" placeholder="Precio" required>
              <input type="number" id="cantidad" placeholder="Cantidad" required>
              <button type="submit">Agregar</button>
            </form>
          </div>

          <!-- Pedidos -->
          <div class="section">
            <h2>Realizar Pedido</h2>
            <form id="pedido-form">
              <input type="number" id="cliente-id" placeholder="ID Cliente" required>
              <textarea id="productos-pedido" placeholder="Productos en formato JSON" required>
  [
    {"nombre": "Producto1", "cantidad": 2, "precio": 12.50},
    {"nombre": "Producto2", "cantidad": 1, "precio": 25.00}
  ]
              </textarea>
              <button type="submit">Realizar Pedido</button>
            </form>
          </div>
        </div>

        <script>
          // Cargar productos
          async function cargarProductos() {
            const response = await fetch('/productos');
            const productos = await response.json();
            const tbody = document.querySelector('#productos-table tbody');
            tbody.innerHTML = '';
            productos.forEach(producto => {
              const tr = document.createElement('tr');
              tr.innerHTML = \`
                <td>\${producto.id}</td>
                <td>\${producto.nombre}</td>
                <td>\${producto.descripcion}</td>
                <td>\${producto.precio}</td>
                <td>\${producto.cantidad}</td>
                <td>
                  <button onclick="borrarProducto(\${producto.id})">Borrar</button>
                </td>
              \`;
              tbody.appendChild(tr);
            });
          }

          // Agregar producto
          document.getElementById('agregar-producto-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre').value;
            const descripcion = document.getElementById('descripcion').value;
            const precio = document.getElementById('precio').value;
            const cantidad = document.getElementById('cantidad').value;

            const response = await fetch('/productos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nombre, descripcion, precio, cantidad })
            });

            if (response.ok) {
              alert('Producto agregado exitosamente');
              cargarProductos();
            } else {
              alert('Error al agregar producto');
            }
          });

          // Borrar producto
          async function borrarProducto(id) {
            const response = await fetch(\`/productos/\${id}\`, { method: 'DELETE' });
            if (response.ok) {
              alert('Producto eliminado');
              cargarProductos();
            } else {
              alert('Error al eliminar producto');
            }
          }

          // Realizar pedido
          document.getElementById('pedido-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const cliente_id = document.getElementById('cliente-id').value;
            const productos = JSON.parse(document.getElementById('productos-pedido').value);

            // Obtener IDs de los productos por nombre
            const productosConId = await Promise.all(productos.map(async (producto) => {
              const res = await fetch('/productos/buscar?nombre=' + producto.nombre);
              const productoDb = await res.json();
              return {
                producto_id: productoDb.id,
                cantidad: producto.cantidad,
                precio: producto.precio
              };
            }));

            const response = await fetch('/pedidos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cliente_id, productos: productosConId })
            });

            if (response.ok) {
              alert('Pedido realizado exitosamente');
            } else {
              alert('Error al realizar pedido');
            }
          });

          // Inicializar
          cargarProductos();
        </script>
      </body>
    </html>
  `);
});


// CRUD para "productos"
app.get('/productos', (req, res) => {
  const query = 'SELECT * FROM productos';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener productos:', err.stack);
      res.status(500).send('Error al obtener productos');
    } else {
      res.status(200).json(results);
    }
  });
});

// Ruta para buscar productos por nombre (nuevo endpoint)
app.get('/productos/buscar', (req, res) => {
  const { nombre } = req.query;
  const query = 'SELECT * FROM productos WHERE nombre = ?';
  connection.query(query, [nombre], (err, results) => {
    if (err) {
      console.error('Error al buscar producto:', err.stack);
      res.status(500).send('Error al buscar producto');
    } else {
      res.status(200).json(results[0]); // Retorna el primer producto que coincida
    }
  });
});

// Rutas de pedidos...
// Aquí sigue el código de CRUD para los pedidos, sin cambios
// Ruta para obtener todos los pedidos
app.get('/pedidos', (req, res) => {
    const query = 'SELECT * FROM Pedidos';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error al obtener pedidos:', err.stack);
        res.status(500).send('Error al obtener pedidos');
      } else {
        res.status(200).json(results);
      }
    });
  });
  
  // Ruta para crear un nuevo pedido
  app.post('/pedidos', (req, res) => {
    const { cliente_id, productos } = req.body; // productos es un array de objetos [{ producto_id, cantidad }]
    const fecha = new Date(); // Fecha actual
    const total = productos.reduce((acc, item) => acc + item.precio * item.cantidad, 0); // Calcula el total
  
    // Insertar el pedido
    const pedidoQuery = 'INSERT INTO Pedidos (cliente_id, fecha, total) VALUES (?, ?, ?)';
    connection.query(pedidoQuery, [cliente_id, fecha, total], (err, results) => {
      if (err) {
        console.error('Error al crear pedido:', err.stack);
        res.status(500).send('Error al crear pedido');
        return;
      }
  
      const pedido_id = results.insertId; // Obtiene el ID del pedido recién creado
  
      // Insertar los detalles del pedido
      const detalleQuery = 'INSERT INTO DetallePedido (pedido_id, producto_id, cantidad, precio) VALUES ?';
      const detalleValues = productos.map((item) => [pedido_id, item.producto_id, item.cantidad, item.precio]);
      connection.query(detalleQuery, [detalleValues], (err) => {
        if (err) {
          console.error('Error al crear detalle del pedido:', err.stack);
          res.status(500).send('Error al crear detalle del pedido');
          return;
        }
  
        res.status(201).send('Pedido creado exitosamente');
      });
    });
  });
  
  // Ruta para eliminar un pedido
  app.delete('/pedidos/:id', (req, res) => {
    const { id } = req.params;
  
    // Primero elimina los detalles del pedido
    const deleteDetalleQuery = 'DELETE FROM DetallePedido WHERE pedido_id = ?';
    connection.query(deleteDetalleQuery, [id], (err) => {
      if (err) {
        console.error('Error al eliminar detalles del pedido:', err.stack);
        res.status(500).send('Error al eliminar detalles del pedido');
        return;
      }
  
      // Luego elimina el pedido
      const deletePedidoQuery = 'DELETE FROM Pedidos WHERE id = ?';
      connection.query(deletePedidoQuery, [id], (err) => {
        if (err) {
          console.error('Error al eliminar pedido:', err.stack);
          res.status(500).send('Error al eliminar pedido');
          return;
        }
  
        res.status(200).send('Pedido eliminado exitosamente');
      });
    });
  });e

// -----------------------
// Iniciar el servidor
// -----------------------
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
