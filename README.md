# Trailerflix

### Pre-entrega 1

**Equipo N° 14** — Integrantes: Milagros Fuentes, Alejo Petricio

---

API REST + servidor web construido con **Express** que expone un catálogo de películas y series a partir de un set de datos en formato JSON. La ruta raíz renderiza una página de bienvenida con **EJS**, y los endpoints de la API responden en formato JSON.

## Dependencias principales

| Dependencia | Versión         | Descripción                                   |
| ----------- | --------------- | --------------------------------------------- |
| `express`   | ^5.2.1          | Framework del servidor web y enrutamiento     |
| `dotenv`    | ^17.4.2         | Carga de variables de entorno desde `.env`    |
| `ejs`       | ^3.1.10         | Motor de plantillas para las vistas HTML      |
| `nodemon`   | ^3.1.14 _(dev)_ | Recarga automática del servidor en desarrollo |

## Instalación y ejecución

**Prerrequisitos:** [Node.js](https://nodejs.org/) (v18 o superior) y npm.

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd trailerflix

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
copy .env.example .env    # Windows
# cp .env.example .env    # Linux / macOS

# 4. Ejecutar el servidor
npm run dev               # desarrollo (nodemon)
# o
npm start                 # producción (node)
```

El servidor quedará disponible en **http://localhost:3008**

## Variables de entorno

El archivo `.env` (no incluido en el repositorio, figura en `.gitignore`) define:

| Variable    | Valor por defecto             | Descripción                                     |
| ----------- | ----------------------------- | ----------------------------------------------- |
| `PORT`      | `3008`                        | Puerto de escucha del servidor web              |
| `DATA_PATH` | `./database/trailerflix.json` | Ruta parcial + nombre del archivo de datos JSON |

Usá `.env.example` como plantilla para generar tu propio `.env`.

## Estructura del proyecto

```
trailerflix/
├── .env                  # Variables de entorno (no se sube a git)
├── .env.example          # Plantilla de variables de entorno
├── .gitignore
├── package.json
├── package-lock.json
├── server.js             # Servidor Express + endpoints de la API
├── database/
│   └── trailerflix.json  # Set de datos (array de objetos)
└── views/
    ├── index.ejs         # Página de bienvenida
    ├── 404.ejs           # Página de ruta no encontrada
    └── partials/
        ├── head.ejs
        ├── navbar.ejs
        └── footer.ejs
```

## Modelo de datos

Cada registro del archivo `database/trailerflix.json` contiene:

| Campo        | Tipo                | Descripción                                   |
| ------------ | ------------------- | --------------------------------------------- |
| `id`         | number              | Código identificador único                    |
| `titulo`     | string              | Título de la película o serie                 |
| `categoria`  | string              | `Serie` o `Película`                          |
| `genero`     | string              | Géneros separados por coma                    |
| `sinopsis`   | string              | Descripción de la trama                       |
| `temporadas` | number \| string    | Cantidad de temporadas (`"N/A"` en películas) |
| `reparto`    | string              | Actores/actrices separados por coma           |
| `trailer`    | string _(opcional)_ | URL del tráiler en YouTube                    |

## Documentación de la API

Todas las respuestas de la API se devuelven en formato **JSON**.

| Método | Ruta              | Descripción                                 |
| ------ | ----------------- | ------------------------------------------- |
| GET    | `/`               | Página de bienvenida (HTML)                 |
| GET    | `/catalogo`       | Lista todo el contenido                     |
| GET    | `/titulo/:title`  | Busca por título (búsqueda parcial)         |
| GET    | `/categoria/:cat` | Filtra por categoría (`serie` o `pelicula`) |
| GET    | `/reparto/:act`   | Busca por actor/actriz (búsqueda parcial)   |
| GET    | `/trailer/:id`    | Devuelve el tráiler por ID                  |

---

### `GET /`

Página de bienvenida en formato HTML con el total de títulos, películas y series del catálogo.

**Respuesta:** `200 OK` (HTML)

---

### `GET /catalogo`

Lista todo el contenido del catálogo.

**Ejemplo:** `GET http://localhost:3008/catalogo`

**Respuesta:** `200 OK`

```json
[
  {
    "id": 1,
    "titulo": "The Crown",
    "categoria": "Serie",
    "genero": "Drama, Hechos verídicos",
    "sinopsis": "Recorre el reinado de Isabel II desde su juventud...",
    "temporadas": 6,
    "reparto": "Claire Foy, Olivia Colman, Imelda Staunton...",
    "trailer": "https://www.youtube.com/results?search_query=The+Crown+trailer+oficial"
  }
]
```

**Sin resultados:** `404 Not Found`

```json
{ "error": "Oops...Ocurrio un problema" }
```

---

### `GET /titulo/:title`

Lista el contenido cuyo título se aproxime al enviado. La búsqueda es **parcial** e ignora mayúsculas/minúsculas.

**Ejemplo:** `GET http://localhost:3008/titulo/holmes`

**Respuesta:** `200 OK`

```json
{
  "resultados": [
    {
      "id": 6,
      "titulo": "Enola Holmes",
      "categoria": "Película",
      "genero": "Aventura, Misterio, Comedia",
      "sinopsis": "La hermana menor de Sherlock Holmes decide buscar por su cuenta a su madre desaparecida...",
      "temporadas": "N/A",
      "reparto": "Millie Bobby Brown, Henry Cavill, Sam Claflin, Helena Bonham Carter",
      "trailer": "https://www.youtube.com/results?search_query=Enola+Holmes+trailer+oficial"
    }
  ]
}
```

**Sin coincidencias:** `404 Not Found`

```json
{ "error": "No hubo coincidencias en la busqueda." }
```

---

### `GET /categoria/:cat`

Lista todo el contenido según la categoría enviada. Categorías válidas: `serie` o `pelicula` (sin distinción de mayúsculas ni tildes).

**Ejemplo:** `GET http://localhost:3008/categoria/serie`

**Respuesta:** `200 OK`

```json
{
  "resultados": [
    {
      "id": 1,
      "titulo": "The Crown",
      "categoria": "Serie",
      "genero": "Drama, Hechos verídicos",
      "sinopsis": "Recorre el reinado de Isabel II desde su juventud...",
      "temporadas": 6,
      "reparto": "Claire Foy, Olivia Colman, Imelda Staunton...",
      "trailer": "https://www.youtube.com/results?search_query=The+Crown+trailer+oficial"
    }
  ]
}
```

**Categoría inválida:** `400 Bad Request`

```json
{
  "error": "Categoría inválida. Los únicos parámetros aceptados son serie o pelicula."
}
```

**Sin resultados:** `404 Not Found`

```json
{ "error": "No se encontró contenido para la categoría: serie" }
```

---

### `GET /reparto/:act`

Lista el catálogo que incluya a la actriz o actor indicado. La búsqueda es **parcial** e ignora mayúsculas/minúsculas.

**Ejemplo:** `GET http://localhost:3008/reparto/pedro pascal`

**Respuesta:** `200 OK`

```json
{
  "resultados": [
    {
      "titulo": "The Mandalorian",
      "reparto": "Pedro Pascal, Gina Carano, Giancarlo Esposito, Carl Weathers, Katee Sackhoff"
    }
  ]
}
```

**Sin coincidencias:** `404 Not Found`

```json
{ "error": "No se encontraron producciones con ese actor." }
```

---

### `GET /trailer/:id`

Devuelve el tráiler de la película o serie con el ID indicado.

**Ejemplo:** `GET http://localhost:3008/trailer/1`

**Respuesta:** `200 OK`

```json
{
  "id": 1,
  "titulo": "The Crown",
  "trailer": "https://www.youtube.com/results?search_query=The+Crown+trailer+oficial"
}
```

**Si el contenido no tiene tráiler disponible**, se devuelve la serie o película solicitada e incluyendo dentro de la respuesta un mensaje en formato JSON notificando la no disponibilidad del mismo:

`GET http://localhost:3008/trailer/5`

```json
{
  "id": 5,
  "titulo": "Gambito de Dama",
  "trailer": "Este título no tiene un trailer disponible."
}
```

**ID inexistente:** `404 Not Found`

```json
{ "error": "No existe ninguna película o serie con el id 999." }
```

**ID no numérico:** `400 Bad Request`

```json
{ "error": "El id debe ser un valor numérico." }
```

---

### Rutas inexistentes

Cualquier ruta no definida responde con la página HTML de error **404**.

## Notas

- Las búsquedas normalizan tildes y mayúsculas/minúsculas: `Película`, `pelicula` y `PELÍCULA` se consideran iguales.
- El archivo `.env` con las variables de entorno y la carpeta `node_modules/` están excluidos de git mediante `.gitignore`.
- El set de datos se carga una sola vez al iniciar el servidor con `fs.readFileSync` + `JSON.parse`.
