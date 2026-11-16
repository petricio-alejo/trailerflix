require("dotenv").config();
const express = require("express");
const path = require("path");
const { Op } = require("sequelize");

const { sequelize, testConnection, closeConnection } = require("./config/db");
const {
  Categoria,
  Genero,
  Actor,
  Contenido,
  ContenidoGenero,
  ContenidoActor,
} = require("./models");
const formatearContenido = require("./utils/formatearContenido");

const app = express();
const PORT = process.env.PORT || 3008;

// ------------------------------------------------------------
// Middlewares y motor de plantillas EJS
// ------------------------------------------------------------
app.use(express.json()); // para leer el body en POST y PUT
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Normaliza un texto: minúsculas, sin espacios extremos y sin tildes.
// Así "Película", "pelicula" y "PELÍCULA" se consideran iguales.
const normalizar = (texto) =>
  texto.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Relaciones que se traen junto con cada contenido
// (through: { attributes: [] } evita traer las columnas de las tablas intermedias)
const incluirRelaciones = [
  { model: Categoria },
  { model: Genero, through: { attributes: [] } },
  { model: Actor, through: { attributes: [] } },
];

// Orden: por id de contenido, y géneros/actores por su id
// (las tablas intermedias no guardan la posición original)
const ordenPorId = [
  ["id_contenido", "ASC"],
  [Genero, "id_genero", "ASC"],
  [Actor, "id_actor", "ASC"],
];

// Convierte "Drama, Comedia" en ["Drama", "Comedia"] (con trim y sin vacíos)
const separarLista = (texto) =>
  texto
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");

// Valida temporadas: número entero >= 0, o "N/A" / null (se guarda NULL)
const temporadasValidas = (valor) =>
  valor === null ||
  valor === "N/A" ||
  (Number.isInteger(valor) && valor >= 0);

// ------------------------------------------------------------
// Ruta raíz: página de bienvenida
// ------------------------------------------------------------
app.get("/", async (req, res) => {
  try {
    const contenidos = await Contenido.findAll({
      include: incluirRelaciones,
      order: ordenPorId,
    });
    const catalogo = contenidos.map(formatearContenido);

    const peliculas = catalogo.filter(
      (c) => normalizar(c.categoria) === "pelicula",
    ).length;
    const series = catalogo.filter(
      (c) => normalizar(c.categoria) === "serie",
    ).length;

    res.render("index", {
      titulo: "Trailerflix",
      catalogo,
      total: catalogo.length,
      peliculas,
      series,
    });
  } catch (error) {
    console.error("Error al obtener el contenido:", error);
    res.status(500).json({ error: "Error al obtener el contenido" });
  }
});

// ------------------------------------------------------------
// Endpoint principal: todo el catálogo con el formato del JSON original
// Parámetros opcionales: ?categoria=serie|pelicula  ?orden=titulo|id
//                        ?limit=N&offset=N
// ------------------------------------------------------------
app.get("/catalogo", async (req, res) => {
  try {
    const { categoria, orden, limit, offset } = req.query;

    const opciones = {
      include: [
        { model: Categoria },
        { model: Genero, through: { attributes: [] } },
        { model: Actor, through: { attributes: [] } },
      ],
      order: ordenPorId,
    };

    // Filtro por categoría (la collation de la base ignora tildes y mayúsculas)
    if (categoria) {
      opciones.include[0].where = { nombre: categoria.trim() };
    }

    // Orden por título o por id
    if (orden) {
      if (orden !== "titulo" && orden !== "id") {
        return res.status(400).json({
          error: "Orden inválido. Los valores aceptados son titulo o id.",
        });
      }
      if (orden === "titulo") {
        opciones.order = [["titulo", "ASC"], ...ordenPorId];
      }
    }

    // Paginado
    if (limit !== undefined || offset !== undefined) {
      const limite = parseInt(limit);
      const desde = offset === undefined ? 0 : parseInt(offset);
      if (isNaN(limite) || isNaN(desde) || limite < 1 || desde < 0) {
        return res.status(400).json({
          error:
            "Los parámetros limit y offset deben ser números enteros (limit mayor a 0).",
        });
      }
      opciones.limit = limite;
      opciones.offset = desde;
    }

    const contenidos = await Contenido.findAll(opciones);

    if (contenidos.length === 0) {
      return res.status(404).json({ error: "Oops...Ocurrio un problema" });
    }
    res.status(200).json(contenidos.map(formatearContenido));
  } catch (error) {
    console.error("Error al obtener el catálogo:", error);
    res.status(500).json({ error: "Error al obtener el catálogo" });
  }
});

app.get("/titulo/:title", async (req, res) => {
  try {
    const tituloBuscado = req.params.title.trim();

    const contenidos = await Contenido.findAll({
      where: { titulo: { [Op.like]: `%${tituloBuscado}%` } },
      include: incluirRelaciones,
      order: ordenPorId,
    });

    if (contenidos.length === 0) {
      return res
        .status(404)
        .json({ error: "No hubo coincidencias en la busqueda." });
    }
    res.status(200).json({ resultados: contenidos.map(formatearContenido) });
  } catch (error) {
    console.error("Error al buscar el contenido:", error);
    res.status(500).json({ error: "Error al buscar el contenido" });
  }
});

app.get("/categoria/:cat", async (req, res) => {
  try {
    const categoriaIngresada = normalizar(req.params.cat);

    // las unicas categorías permitidas
    const categoriasValidas = ["serie", "pelicula"];

    if (!categoriasValidas.includes(categoriaIngresada)) {
      return res.status(400).json({
        error:
          "Categoría inválida. Los únicos parámetros aceptados son serie o pelicula.",
      });
    }

    // La collation utf8mb4_unicode_ci hace que "pelicula" coincida con "Película"
    const contenidos = await Contenido.findAll({
      include: [
        { model: Categoria, where: { nombre: categoriaIngresada } },
        { model: Genero, through: { attributes: [] } },
        { model: Actor, through: { attributes: [] } },
      ],
      order: ordenPorId,
    });

    if (contenidos.length === 0) {
      return res.status(404).json({
        error: `No se encontró contenido para la categoría: ${categoriaIngresada}`,
      });
    }

    res.status(200).json({ resultados: contenidos.map(formatearContenido) });
  } catch (error) {
    console.error("Error al filtrar el contenido:", error);
    res.status(500).json({ error: "Error al filtrar el contenido" });
  }
});

app.get("/reparto/:act", async (req, res) => {
  try {
    const actorBuscado = req.params.act.trim();

    // 1) Buscamos solo los ids de los contenidos donde aparece el actor.
    //    (Si filtráramos con where dentro del include al traer el contenido
    //    completo, el reparto devuelto quedaría recortado a ese actor.)
    const coincidencias = await Contenido.findAll({
      attributes: ["id_contenido"],
      include: [
        {
          model: Actor,
          attributes: [],
          through: { attributes: [] },
          where: { nombre_completo: { [Op.like]: `%${actorBuscado}%` } },
        },
      ],
    });

    if (coincidencias.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontraron producciones con ese actor." });
    }

    // 2) Traemos esos contenidos completos, con todo su reparto
    const ids = coincidencias.map((c) => c.id_contenido);
    const contenidos = await Contenido.findAll({
      where: { id_contenido: ids },
      include: incluirRelaciones,
      order: ordenPorId,
    });

    const respuestaMapeada = contenidos.map((contenido) => {
      const formateado = formatearContenido(contenido);
      return {
        titulo: formateado.titulo,
        reparto: formateado.reparto,
      };
    });

    res.status(200).json({ resultados: respuestaMapeada });
  } catch (error) {
    console.error("Error al buscar el reparto del contenido:", error);
    res.status(500).json({ error: "Error al buscar el reparto del contenido" });
  }
});

app.get("/trailer/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ error: "El id debe ser un valor numérico." });
    }

    const contenido = await Contenido.findByPk(id);

    if (!contenido) {
      return res
        .status(404)
        .json({ error: `No existe ninguna película o serie con el id ${id}.` });
    }

    // No todos tienen trailer (en la base figura NULL)
    if (!contenido.trailer) {
      return res.status(200).json({
        id: contenido.id_contenido,
        titulo: contenido.titulo,
        trailer: "Este título no tiene un trailer disponible.",
      });
    }

    // Respondemos solo id, titulo y trailer
    res.status(200).json({
      id: contenido.id_contenido,
      titulo: contenido.titulo,
      trailer: contenido.trailer,
    });
  } catch (error) {
    console.error("Error al obtener el trailer del contenido:", error);
    res
      .status(500)
      .json({ error: "Error al obtener el trailer del contenido" });
  }
});

// ------------------------------------------------------------
// CRUD de contenido
// ------------------------------------------------------------

// Listado completo
app.get("/contenido", async (req, res) => {
  try {
    const contenidos = await Contenido.findAll({
      include: incluirRelaciones,
      order: ordenPorId,
    });
    res.json(contenidos.map(formatearContenido));
  } catch (error) {
    console.error("Error al obtener el contenido:", error);
    res.status(500).json({ error: "Error al obtener el contenido" });
  }
});

// Un contenido por id
app.get("/contenido/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ error: "El id debe ser un valor numérico." });
    }

    const contenido = await Contenido.findByPk(id, {
      include: incluirRelaciones,
      order: ordenPorId.slice(1),
    });

    if (!contenido) {
      return res.status(404).json({ error: "Contenido no encontrado" });
    }
    res.json(formatearContenido(contenido));
  } catch (error) {
    console.error("Error al obtener el contenido:", error);
    res.status(500).json({ error: "Error al obtener el contenido" });
  }
});

// Crear contenido
// Body con el formato del JSON original, sin id:
// { titulo, categoria, genero, sinopsis, temporadas, reparto, trailer }
app.post("/contenido", async (req, res) => {
  let t;
  try {
    const { titulo, categoria, genero, sinopsis, temporadas, reparto, trailer } =
      req.body || {};

    // --- Validaciones (salimos temprano con 400 / 409) ---
    if (
      typeof titulo !== "string" || titulo.trim() === "" ||
      typeof categoria !== "string" || categoria.trim() === "" ||
      typeof sinopsis !== "string" || sinopsis.trim() === ""
    ) {
      return res.status(400).json({
        error: "Los campos titulo, categoria y sinopsis son obligatorios.",
      });
    }
    if (
      (genero !== undefined && typeof genero !== "string") ||
      (reparto !== undefined && typeof reparto !== "string")
    ) {
      return res.status(400).json({
        error: "Los campos genero y reparto deben ser textos separados por coma.",
      });
    }
    if (temporadas !== undefined && !temporadasValidas(temporadas)) {
      return res.status(400).json({
        error: 'El campo temporadas debe ser un número entero o "N/A".',
      });
    }
    if (trailer !== undefined && trailer !== null && typeof trailer !== "string") {
      return res.status(400).json({ error: "El campo trailer debe ser un texto." });
    }

    // La collation de la base ignora mayúsculas y tildes ("pelicula" = "Película")
    const categoriaEncontrada = await Categoria.findOne({
      where: { nombre: categoria.trim() },
    });
    if (!categoriaEncontrada) {
      return res.status(400).json({
        error: "Categoría inválida. Los únicos valores aceptados son Serie o Película.",
      });
    }

    const existente = await Contenido.findOne({
      where: { titulo: titulo.trim() },
    });
    if (existente) {
      return res
        .status(409)
        .json({ error: "Ya existe un contenido con ese título." });
    }

    // --- Alta dentro de una transacción ---
    t = await sequelize.transaction();

    // id_contenido no es AUTO_INCREMENT en la tabla y la base no se puede
    // modificar: calculamos el id nuevo como el máximo actual + 1.
    // Se hace dentro de la transacción para minimizar choques entre altas.
    const maxId = await Contenido.max("id_contenido", { transaction: t });
    const nuevoId = (maxId || 0) + 1;

    const nuevo = await Contenido.create(
      {
        id_contenido: nuevoId,
        titulo: titulo.trim(),
        id_categoria: categoriaEncontrada.id_categoria,
        sinopsis: sinopsis.trim(),
        temporadas:
          temporadas === undefined || temporadas === "N/A" ? null : temporadas,
        trailer: trailer ? trailer.trim() : null,
      },
      { transaction: t },
    );

    // Géneros: se buscan por nombre y, si no existen, se crean
    const generos = [];
    for (const nombre of separarLista(genero || "")) {
      const [g] = await Genero.findOrCreate({
        where: { nombre },
        transaction: t,
      });
      generos.push(g);
    }
    await nuevo.setGeneros(generos, { transaction: t });

    // Actores: misma lógica
    const actores = [];
    for (const nombre_completo of separarLista(reparto || "")) {
      const [a] = await Actor.findOrCreate({
        where: { nombre_completo },
        transaction: t,
      });
      actores.push(a);
    }
    await nuevo.setActores(actores, { transaction: t });

    // Releemos el contenido con sus relaciones antes del commit
    const creado = await Contenido.findByPk(nuevoId, {
      include: incluirRelaciones,
      order: ordenPorId.slice(1),
      transaction: t,
    });

    await t.commit();
    res.status(201).json(formatearContenido(creado));
  } catch (error) {
    if (t) await t.rollback();
    console.error("Error al crear el contenido:", error);
    res.status(500).json({ error: "Error al crear el contenido" });
  }
});

// Actualizar contenido (los campos que no vienen conservan su valor;
// genero y reparto, si vienen, reemplazan las relaciones)
app.put("/contenido/:id", async (req, res) => {
  let t;
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ error: "El id debe ser un valor numérico." });
    }

    const contenido = await Contenido.findByPk(id);
    if (!contenido) {
      return res.status(404).json({ error: "Contenido no encontrado" });
    }

    const { titulo, categoria, genero, sinopsis, temporadas, reparto, trailer } =
      req.body || {};

    // --- Validaciones ---
    if (
      (titulo !== undefined && (typeof titulo !== "string" || titulo.trim() === "")) ||
      (sinopsis !== undefined && (typeof sinopsis !== "string" || sinopsis.trim() === "")) ||
      (categoria !== undefined && (typeof categoria !== "string" || categoria.trim() === ""))
    ) {
      return res.status(400).json({
        error: "Los campos titulo, categoria y sinopsis no pueden quedar vacíos.",
      });
    }
    if (
      (genero !== undefined && typeof genero !== "string") ||
      (reparto !== undefined && typeof reparto !== "string")
    ) {
      return res.status(400).json({
        error: "Los campos genero y reparto deben ser textos separados por coma.",
      });
    }
    if (temporadas !== undefined && !temporadasValidas(temporadas)) {
      return res.status(400).json({
        error: 'El campo temporadas debe ser un número entero o "N/A".',
      });
    }
    if (trailer !== undefined && trailer !== null && typeof trailer !== "string") {
      return res.status(400).json({ error: "El campo trailer debe ser un texto." });
    }

    // Armamos solo con los campos que llegaron en el body
    const cambios = {};

    if (titulo !== undefined) {
      const repetido = await Contenido.findOne({
        where: { titulo: titulo.trim(), id_contenido: { [Op.ne]: id } },
      });
      if (repetido) {
        return res
          .status(409)
          .json({ error: "Ya existe un contenido con ese título." });
      }
      cambios.titulo = titulo.trim();
    }

    if (categoria !== undefined) {
      const categoriaEncontrada = await Categoria.findOne({
        where: { nombre: categoria.trim() },
      });
      if (!categoriaEncontrada) {
        return res.status(400).json({
          error: "Categoría inválida. Los únicos valores aceptados son Serie o Película.",
        });
      }
      cambios.id_categoria = categoriaEncontrada.id_categoria;
    }

    if (sinopsis !== undefined) cambios.sinopsis = sinopsis.trim();
    if (temporadas !== undefined) {
      cambios.temporadas = temporadas === "N/A" ? null : temporadas;
    }
    if (trailer !== undefined) cambios.trailer = trailer ? trailer.trim() : null;

    // --- Actualización dentro de una transacción ---
    t = await sequelize.transaction();

    await contenido.update(cambios, { transaction: t });

    if (genero !== undefined) {
      const generos = [];
      for (const nombre of separarLista(genero)) {
        const [g] = await Genero.findOrCreate({
          where: { nombre },
          transaction: t,
        });
        generos.push(g);
      }
      await contenido.setGeneros(generos, { transaction: t });
    }

    if (reparto !== undefined) {
      const actores = [];
      for (const nombre_completo of separarLista(reparto)) {
        const [a] = await Actor.findOrCreate({
          where: { nombre_completo },
          transaction: t,
        });
        actores.push(a);
      }
      await contenido.setActores(actores, { transaction: t });
    }

    const actualizado = await Contenido.findByPk(id, {
      include: incluirRelaciones,
      order: ordenPorId.slice(1),
      transaction: t,
    });

    await t.commit();
    res.json(formatearContenido(actualizado));
  } catch (error) {
    if (t) await t.rollback();
    console.error("Error al actualizar el contenido:", error);
    res.status(500).json({ error: "Error al actualizar el contenido" });
  }
});

// Eliminar contenido (y sus filas en las tablas intermedias).
// No se borran géneros ni actores: pueden estar en otros contenidos.
app.delete("/contenido/:id", async (req, res) => {
  let t;
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ error: "El id debe ser un valor numérico." });
    }

    const contenido = await Contenido.findByPk(id);
    if (!contenido) {
      return res.status(404).json({ error: "Contenido no encontrado" });
    }

    t = await sequelize.transaction();

    await ContenidoGenero.destroy({ where: { id_contenido: id }, transaction: t });
    await ContenidoActor.destroy({ where: { id_contenido: id }, transaction: t });
    await contenido.destroy({ transaction: t });

    await t.commit();
    res.json({ message: "Contenido eliminado correctamente" });
  } catch (error) {
    if (t) await t.rollback();
    console.error("Error al eliminar el contenido:", error);
    res.status(500).json({ error: "Error al eliminar el contenido" });
  }
});

// ------------------------------------------------------------
// Body con JSON mal formado (lo detecta express.json)
// ------------------------------------------------------------
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El body debe ser un JSON válido." });
  }
  next(error);
});

// ------------------------------------------------------------
// Rutas inexistentes: página 404
// ------------------------------------------------------------
app.use((req, res) => {
  res.status(404).render("404", {
    titulo: "Página no encontrada",
    rutaSolicitada: req.originalUrl,
  });
});

// ------------------------------------------------------------
// Arranque: primero se verifica la conexión a MySQL.
// Si falla, el servidor no se levanta.
// ------------------------------------------------------------
async function iniciarServidor() {
  const conectado = await testConnection();
  if (!conectado) {
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Al apagar el servidor (Ctrl+C o kill) se cierra la conexión a la base
async function apagarServidor() {
  await closeConnection();
  process.exit(0);
}
process.on("SIGINT", apagarServidor);
process.on("SIGTERM", apagarServidor);

iniciarServidor();
