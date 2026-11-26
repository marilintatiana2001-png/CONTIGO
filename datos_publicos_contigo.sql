-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: contigo_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`) VALUES (1,'Mandalas','Actividades interactivas de coloreado y creación de mandalas para favorecer la concentración y expresión emocional.');
INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`) VALUES (2,'Respiración','Actividades guiadas de respiración para ayudar a regular momentos de tensión o inquietud.');
INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`) VALUES (3,'Relajación','Actividades orientadas a disminuir la tensión y favorecer una sensación de calma.');
INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`) VALUES (4,'Movimiento','Actividades de movimiento corporal suave para favorecer el bienestar emocional.');
INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`) VALUES (5,'Creatividad','Actividades interactivas para crear, transformar y experimentar con diferentes recursos visuales.');
INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`) VALUES (6,'Arteterapia','Actividades de expresión artística mediante dibujo, pintura y otras formas creativas de representación emocional.');

--
-- Dumping data for table `emociones`
--

INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (1,'Ansiedad','Sensación de preocupación, inquietud o nerviosismo difícil de controlar.','ansiedad');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (2,'Tristeza','Sensación de desánimo, vacío o falta de interés que puede afectar el bienestar.','tristeza');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (3,'Miedo','Sensación de temor, inseguridad o preocupación ante una situación.','miedo');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (4,'Soledad','Sensación de aislamiento, desconexión o falta de compañía.','soledad');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (5,'Enojo','Sensación de irritación, rabia o molestia ante una situación.','enojo');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (6,'Frustración','Sensación de impotencia, dificultad o molestia cuando algo no sale como se espera.','frustracion');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (7,'Culpa','Sensación de responsabilidad o arrepentimiento por algo ocurrido.','culpa');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (8,'Vergüenza','Sensación de incomodidad, inseguridad o deseo de ocultarse frente a una situación.','verguenza');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (9,'Estrés','Sensación de tensión física o mental ante situaciones que generan presión.','estres');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (10,'Angustia','Sensación intensa de malestar, preocupación o intranquilidad.','angustia');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (11,'Desesperanza','Sensación de falta de esperanza o dificultad para imaginar que una situación pueda mejorar.','desesperanza');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (12,'Vacío emocional','Sensación de vacío, desconexión o falta de satisfacción emocional.','vacio');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (13,'Inseguridad','Sensación de duda o falta de confianza en uno mismo o en las propias decisiones.','inseguridad');
INSERT INTO `emociones` (`id_emocion`, `nombre`, `descripcion`, `icono`) VALUES (14,'Agobio','Sensación de estar sobrecargado emocional o mentalmente por las circunstancias.','agobio');

--
-- Dumping data for table `actividades`
--

INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (1,2,1,'Infla el globito','Seguir una animacion que se expande y se contrae para acompan ar una respiracion comoda.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (2,3,1,'Vuelve al presente','Identificar cinco cosas que puedes ver a tu alrededor.','guiada',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (3,1,1,'Colorea la mandala','Colorear una mandala sencilla con los colores disponibles.','interactiva',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (4,6,2,'Colores de hoy','Elegir colores para crear una imagen que represente como te sientes.','creativa',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (5,5,2,'Un pequeño paso','Elegir una accion cotidiana pequena que te gustaria realizar.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (6,2,2,'Flor y vela','Seguir una guia visual para inhalar y exhalar suavemente.','guiada',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (7,2,3,'Respira con la nube','Acompan ar una nube animada con una respiracion tranquila.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (8,5,3,'Mi lugar seguro','Crear un lugar imaginario agradable mediante elementos visuales.','creativa',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (9,3,3,'Vuelve al presente','Identificar cinco cosas que puedes ver a tu alrededor.','guiada',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (10,5,4,'Crea un personaje','Combinar ojos, bocas y formas para crear un personaje.','interactiva',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (11,5,4,'Un pequeño paso','Elegir una accion sencilla de conexion con alguien de confianza.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (12,6,4,'Elige una frase amable','Escoger una frase de apoyo y acompanarla con un fondo de colores.','creativa',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (13,3,5,'Pausa antes de actuar','Hacer una pausa y elegir como responder ante una situacion.','guiada',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (14,4,5,'Sacude la tensión','Mover suavemente las manos y los brazos.','guiada',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (15,6,5,'Pintura libre','Expresar lo que sientes mediante colores y formas.','creativa',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (16,3,6,'Manos suaves','Cerrar y soltar suavemente las manos, si resulta comodo.','guiada',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (17,5,6,'Completa el dibujo','Anadir elementos a una ilustracion incompleta.','interactiva',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (18,5,6,'Un pequeño paso','Elegir una accion pequena y alcanzable para avanzar.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (19,6,7,'Elige una frase amable','Seleccionar una frase de autocompasion.','creativa',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (20,6,7,'Colores de hoy','Crear una imagen con colores que representen tu estado emocional.','creativa',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (21,5,7,'Un paso para reparar','Elegir como aprender de lo ocurrido o reparar el dano si corresponde.','interactiva',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (22,2,8,'Respira con la nube','Seguir una animacion de respiracion suave.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (23,5,8,'Crea un personaje','Crear un personaje combinando elementos visuales.','interactiva',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (24,6,8,'Elige una frase amable','Elegir una frase que recuerde que los errores no definen nuestro valor.','creativa',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (25,2,9,'Respira en un cuadrado','Seguir una animacion que guia una respiracion comoda.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (26,4,9,'Suelta los hombros','Realizar movimientos suaves de hombros para relajarse.','guiada',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (27,1,9,'Colorea la mandala','Colorear una mandala con una paleta de colores elegida.','interactiva',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (28,2,10,'Infla el globito','Acompan ar la animacion con respiraciones comodas, sin forzar.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (29,3,10,'Vuelve al presente','Observar elementos del entorno para reconectar con el presente.','guiada',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (30,5,10,'Mi lugar seguro','Crear un escenario imaginario agradable mediante elementos visuales.','creativa',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (31,5,11,'Decora una estrella','Personalizar una estrella como simbolo de algo que te importa.','interactiva',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (32,5,11,'Un pequeño paso','Elegir una actividad sencilla que puedas intentar hoy.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (33,6,11,'Arcoíris emocional','Crear un arcoiris usando los colores que prefieras.','creativa',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (34,6,12,'Dibuja tu clima','Elegir elementos del clima para representar como te sientes.','creativa',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (35,6,12,'Pintura libre','Combinar colores y formas en un lienzo digital.','creativa',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (36,5,12,'Un pequeño paso','Elegir una actividad cotidiana que quieras explorar.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (37,6,13,'Elige una frase amable','Seleccionar una frase de animo para acompanarla con una ilustracion.','creativa',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (38,1,13,'Completa el patrón','Elegir los colores que faltan para completar una figura sencilla.','interactiva',3);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (39,5,13,'Mis pequeños logros','Seleccionar algo que hayas intentado, aprendido o conseguido.','interactiva',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (40,3,14,'Pausa entre nubes','Observar una animacion tranquila durante unos segundos.','guiada',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (41,4,14,'Estira tus brazos','Seguir una animacion de estiramiento suave.','guiada',2);
INSERT INTO `actividades` (`id_actividad`, `id_categoria`, `id_emocion`, `nombre`, `descripcion`, `tipo`, `duracion`) VALUES (42,5,14,'Organiza un paso','Elegir una tarea y dividirla en un primer paso pequeno.','interactiva',3);

--
-- Dumping data for table `recursos_ayuda`
--

INSERT INTO `recursos_ayuda` (`id_recurso`, `nombre`, `descripcion`, `telefono`, `url`, `tipo`) VALUES (1,'Linea 106 - Apoyo emocional','Bogota. Servicio gratuito de escucha y orientacion emocional, disponible las 24 horas.','106','https://www.saludcapital.gov.co/Paginas2/llamanos_Linea106.aspx','Salud mental');
INSERT INTO `recursos_ayuda` (`id_recurso`, `nombre`, `descripcion`, `telefono`, `url`, `tipo`) VALUES (2,'Linea 141 - Proteccion de menores','Colombia. Atencion gratuita para niños, niñas y adolescentes ante maltrato, abuso o vulneracion de sus derechos.','141','https://www.icbf.gov.co/linea-141','Proteccion');
INSERT INTO `recursos_ayuda` (`id_recurso`, `nombre`, `descripcion`, `telefono`, `url`, `tipo`) VALUES (4,'Linea 155 - Orientacion ante violencia','Colombia. Orientacion gratuita las 24 horas para personas victimas de violencia basada en genero. Ofrece informacion sobre derechos, apoyo y rutas de atencion.','155','https://www.policia.gov.co/patrulla-purpura','Proteccion y orientacion');
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-25 11:26:10
