require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3008;

// ------------------------------------------------------------
// Configuración del motor de plantillas EJS
// ------------------------------------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ------------------------------------------------------------
// Carga de datos con FileSystem API + JSON.parse
// ------------------------------------------------------------
const dataPath = process.env.DATA_PATH;
const data = fs.readFileSync(dataPath, "utf-8");
const TRAILERFLIX = JSON.parse(data);

console.log(
  `Datos cargados: ${TRAILERFLIX.length} registros desde ${dataPath}`,
);

// Normaliza un texto: minúsculas, sin espacios extremos y sin tildes.
// Así "Película", "pelicula" y "PELÍCULA" se consideran iguales.
const normalizar = (texto) =>
  texto.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// ------------------------------------------------------------
// Ruta raíz: página de bienvenida
// ------------------------------------------------------------
app.get("/", (req, res) => {
  const peliculas = TRAILERFLIX.filter(
    (c) => normalizar(c.categoria) === "pelicula",
  ).length;
  const series = TRAILERFLIX.filter(
    (c) => normalizar(c.categoria) === "serie",
  ).length;

  res.render("index", {
    titulo: "Trailerflix",
    catalogo: TRAILERFLIX,
    total: TRAILERFLIX.length,
    peliculas,
    series,
  });
});

// ------------------------------------------------------------
// Endpoints de la API
// ------------------------------------------------------------
app.get("/catalogo", (req, res) => {
  if (TRAILERFLIX.length === 0) {
    return res.status(404).json({ error: "Oops...Ocurrio un problema" });
  }
  res.status(200).json(TRAILERFLIX);
});

app.get("/titulo/:title", (req, res) => {
  const tituloBuscado = req.params.title.toLowerCase();
  const resultados = TRAILERFLIX.filter((contenido) => {
    return contenido.titulo.trim().toLowerCase().includes(tituloBuscado);
  });
  if (resultados.length === 0) {
    return res
      .status(404)
      .json({ error: "No hubo coincidencias en la busqueda." });
  }
  res.status(200).json({ resultados });
});

app.get("/categoria/:cat", (req, res) => {
  const categoriaIngresada = normalizar(req.params.cat);

  // las unicas categorías permitidas
  const categoriasValidas = ["serie", "pelicula"];

  if (!categoriasValidas.includes(categoriaIngresada)) {
    return res.status(400).json({
      error:
        "Categoría inválida. Los únicos parámetros aceptados son serie o pelicula.",
    });
  }

  // Se normaliza también la categoría del JSON, porque ahí figura "Película" con tilde
  const resultados = TRAILERFLIX.filter((contenido) => {
    return normalizar(contenido.categoria) === categoriaIngresada;
  });

  if (resultados.length === 0) {
    return res.status(404).json({
      error: `No se encontró contenido para la categoría: ${categoriaIngresada}`,
    });
  }

  res.status(200).json({ resultados });
});

app.get("/reparto/:act", (req, res) => {
  const actorBuscado = req.params.act.toLowerCase();

  const resultadosFiltrados = TRAILERFLIX.filter((contenido) =>
    contenido.reparto.toLowerCase().includes(actorBuscado),
  );

  if (resultadosFiltrados.length === 0) {
    return res
      .status(404)
      .json({ error: "No se encontraron producciones con ese actor." });
  }

  const respuestaMapeada = resultadosFiltrados.map((contenido) => {
    return {
      titulo: contenido.titulo,
      reparto: contenido.reparto,
    };
  });

  res.status(200).json({ resultados: respuestaMapeada });
});

app.get("/trailer/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "El id debe ser un valor numérico." });
  }

  const contenido = TRAILERFLIX.find((c) => c.id === id);

  if (!contenido) {
    return res
      .status(404)
      .json({ error: `No existe ninguna película o serie con el id ${id}.` });
  }

  // No todos tienen trailer: usamos el operador de acceso condicional ?
  if (!contenido?.trailer) {
    return res.status(200).json({
      id: contenido.id,
      titulo: contenido.titulo,
      trailer: "Este título no tiene un trailer disponible.",
    });
  }

  // Respondemos solo id, titulo y trailer
  res.status(200).json({
    id: contenido.id,
    titulo: contenido.titulo,
    trailer: contenido.trailer,
  });
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
