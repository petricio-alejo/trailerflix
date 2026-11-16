// ------------------------------------------------------------
// Convierte un registro de Contenido (con Categoria, Generos y Actores
// incluidos) al mismo formato que tenía el archivo trailerflix.json
// ------------------------------------------------------------
function formatearContenido(contenido) {
  const resultado = {
    id: contenido.id_contenido,
    titulo: contenido.titulo,
    categoria: contenido.Categoria ? contenido.Categoria.nombre : null,
    genero: (contenido.Generos || []).map((g) => g.nombre).join(', '),
    sinopsis: contenido.sinopsis,
    // En la base las películas tienen NULL; en el JSON original era "N/A"
    temporadas: contenido.temporadas === null ? 'N/A' : contenido.temporadas,
    reparto: (contenido.Actores || []).map((a) => a.nombre_completo).join(', '),
  };

  // El trailer solo se agrega si existe (igual que en el JSON original)
  if (contenido.trailer) {
    resultado.trailer = contenido.trailer;
  }

  return resultado;
}

module.exports = formatearContenido;
