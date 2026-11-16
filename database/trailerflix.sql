CREATE TABLE IF NOT EXISTS `categorias` (
	`id_categoria` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(50) NOT NULL,
	PRIMARY KEY (`id_categoria`)
);
CREATE TABLE IF NOT EXISTS `generos` (
	`id_genero` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(50) NOT NULL,
	PRIMARY KEY (`id_genero`)
);
CREATE TABLE IF NOT EXISTS `actores` (
	`id_actor` int AUTO_INCREMENT NOT NULL,
	`nombre_completo` varchar(100) NOT NULL,
	PRIMARY KEY (`id_actor`)
);
CREATE TABLE IF NOT EXISTS `contenido` (
	`id_contenido` int NOT NULL,
	`titulo` varchar(150) NOT NULL,
	`id_categoria` int NOT NULL,
	`sinopsis` text,
	`temporadas` int,
	`trailer` varchar(255),
	PRIMARY KEY (`id_contenido`)
);
CREATE TABLE IF NOT EXISTS `contenido_generos` (
	`id_contenido` int NOT NULL,
	`id_genero` int NOT NULL,
	PRIMARY KEY (`id_contenido`, `id_genero`)
);
CREATE TABLE IF NOT EXISTS `contenido_actores` (
	`id_contenido` int NOT NULL,
	`id_actor` int NOT NULL,
	PRIMARY KEY (`id_contenido`, `id_actor`)
);
ALTER TABLE `contenido` ADD CONSTRAINT `fk_contenido_id_categoria` FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria);
ALTER TABLE `contenido_generos` ADD CONSTRAINT `fk_contenido_generos_id_contenido` FOREIGN KEY (id_contenido) REFERENCES contenido (id_contenido);
ALTER TABLE `contenido_generos` ADD CONSTRAINT `fk_contenido_generos_id_genero` FOREIGN KEY (id_genero) REFERENCES generos (id_genero);
ALTER TABLE `contenido_actores` ADD CONSTRAINT `fk_contenido_actores_id_contenido` FOREIGN KEY (id_contenido) REFERENCES contenido (id_contenido);
ALTER TABLE `contenido_actores` ADD CONSTRAINT `fk_contenido_actores_id_actor` FOREIGN KEY (id_actor) REFERENCES actores (id_actor);