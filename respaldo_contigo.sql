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
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `contigo_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `contigo_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `contigo_db`;

--
-- Table structure for table `actividades`
--

DROP TABLE IF EXISTS `actividades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `actividades` (
  `id_actividad` int(11) NOT NULL AUTO_INCREMENT,
  `id_categoria` int(11) NOT NULL,
  `id_emocion` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `duracion` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_actividad`),
  KEY `fk_actividad_categoria` (`id_categoria`),
  KEY `fk_actividad_emocion` (`id_emocion`),
  CONSTRAINT `fk_actividad_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON UPDATE CASCADE,
  CONSTRAINT `fk_actividad_emocion` FOREIGN KEY (`id_emocion`) REFERENCES `emociones` (`id_emocion`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actividades`
--

LOCK TABLES `actividades` WRITE;
/*!40000 ALTER TABLE `actividades` DISABLE KEYS */;
INSERT INTO `actividades` VALUES (1,2,1,'Infla el globito','Seguir una animacion que se expande y se contrae para acompan ar una respiracion comoda.','interactiva',2),(2,3,1,'Vuelve al presente','Identificar cinco cosas que puedes ver a tu alrededor.','guiada',2),(3,1,1,'Colorea la mandala','Colorear una mandala sencilla con los colores disponibles.','interactiva',3),(4,6,2,'Colores de hoy','Elegir colores para crear una imagen que represente como te sientes.','creativa',3),(5,5,2,'Un pequeño paso','Elegir una accion cotidiana pequena que te gustaria realizar.','interactiva',2),(6,2,2,'Flor y vela','Seguir una guia visual para inhalar y exhalar suavemente.','guiada',2),(7,2,3,'Respira con la nube','Acompan ar una nube animada con una respiracion tranquila.','interactiva',2),(8,5,3,'Mi lugar seguro','Crear un lugar imaginario agradable mediante elementos visuales.','creativa',3),(9,3,3,'Vuelve al presente','Identificar cinco cosas que puedes ver a tu alrededor.','guiada',2),(10,5,4,'Crea un personaje','Combinar ojos, bocas y formas para crear un personaje.','interactiva',3),(11,5,4,'Un pequeño paso','Elegir una accion sencilla de conexion con alguien de confianza.','interactiva',2),(12,6,4,'Elige una frase amable','Escoger una frase de apoyo y acompanarla con un fondo de colores.','creativa',2),(13,3,5,'Pausa antes de actuar','Hacer una pausa y elegir como responder ante una situacion.','guiada',2),(14,4,5,'Sacude la tensión','Mover suavemente las manos y los brazos.','guiada',2),(15,6,5,'Pintura libre','Expresar lo que sientes mediante colores y formas.','creativa',3),(16,3,6,'Manos suaves','Cerrar y soltar suavemente las manos, si resulta comodo.','guiada',2),(17,5,6,'Completa el dibujo','Anadir elementos a una ilustracion incompleta.','interactiva',3),(18,5,6,'Un pequeño paso','Elegir una accion pequena y alcanzable para avanzar.','interactiva',2),(19,6,7,'Elige una frase amable','Seleccionar una frase de autocompasion.','creativa',2),(20,6,7,'Colores de hoy','Crear una imagen con colores que representen tu estado emocional.','creativa',3),(21,5,7,'Un paso para reparar','Elegir como aprender de lo ocurrido o reparar el dano si corresponde.','interactiva',3),(22,2,8,'Respira con la nube','Seguir una animacion de respiracion suave.','interactiva',2),(23,5,8,'Crea un personaje','Crear un personaje combinando elementos visuales.','interactiva',3),(24,6,8,'Elige una frase amable','Elegir una frase que recuerde que los errores no definen nuestro valor.','creativa',2),(25,2,9,'Respira en un cuadrado','Seguir una animacion que guia una respiracion comoda.','interactiva',2),(26,4,9,'Suelta los hombros','Realizar movimientos suaves de hombros para relajarse.','guiada',2),(27,1,9,'Colorea la mandala','Colorear una mandala con una paleta de colores elegida.','interactiva',3),(28,2,10,'Infla el globito','Acompan ar la animacion con respiraciones comodas, sin forzar.','interactiva',2),(29,3,10,'Vuelve al presente','Observar elementos del entorno para reconectar con el presente.','guiada',2),(30,5,10,'Mi lugar seguro','Crear un escenario imaginario agradable mediante elementos visuales.','creativa',3),(31,5,11,'Decora una estrella','Personalizar una estrella como simbolo de algo que te importa.','interactiva',3),(32,5,11,'Un pequeño paso','Elegir una actividad sencilla que puedas intentar hoy.','interactiva',2),(33,6,11,'Arcoíris emocional','Crear un arcoiris usando los colores que prefieras.','creativa',3),(34,6,12,'Dibuja tu clima','Elegir elementos del clima para representar como te sientes.','creativa',3),(35,6,12,'Pintura libre','Combinar colores y formas en un lienzo digital.','creativa',3),(36,5,12,'Un pequeño paso','Elegir una actividad cotidiana que quieras explorar.','interactiva',2),(37,6,13,'Elige una frase amable','Seleccionar una frase de animo para acompanarla con una ilustracion.','creativa',2),(38,1,13,'Completa el patrón','Elegir los colores que faltan para completar una figura sencilla.','interactiva',3),(39,5,13,'Mis pequeños logros','Seleccionar algo que hayas intentado, aprendido o conseguido.','interactiva',2),(40,3,14,'Pausa entre nubes','Observar una animacion tranquila durante unos segundos.','guiada',2),(41,4,14,'Estira tus brazos','Seguir una animacion de estiramiento suave.','guiada',2),(42,5,14,'Organiza un paso','Elegir una tarea y dividirla en un primer paso pequeno.','interactiva',3);
/*!40000 ALTER TABLE `actividades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `actividades_realizadas`
--

DROP TABLE IF EXISTS `actividades_realizadas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `actividades_realizadas` (
  `id_realizacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_actividad` int(11) NOT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp(),
  `resultado` text DEFAULT NULL,
  `clave_evento` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id_realizacion`),
  UNIQUE KEY `uq_actividad_clave_evento` (`clave_evento`),
  KEY `fk_realizacion_usuario` (`id_usuario`),
  KEY `fk_realizacion_actividad` (`id_actividad`),
  CONSTRAINT `fk_realizacion_actividad` FOREIGN KEY (`id_actividad`) REFERENCES `actividades` (`id_actividad`) ON UPDATE CASCADE,
  CONSTRAINT `fk_realizacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actividades_realizadas`
--

LOCK TABLES `actividades_realizadas` WRITE;
/*!40000 ALTER TABLE `actividades_realizadas` DISABLE KEYS */;
INSERT INTO `actividades_realizadas` VALUES (1,3,6,'2026-11-02 15:24:08','Completada en CONTIGO','a904cea8-2c65-4654-b8c3-1769a3a03799'),(2,3,7,'2026-11-04 07:48:25','Completada en CONTIGO','39654b96-a4b8-452e-aae3-7ae2a7e511d8'),(3,3,7,'2026-11-04 10:37:32','Completada en CONTIGO','677a4ebd-6f01-4e8e-b89e-8508756358eb'),(4,3,26,'2026-11-11 10:51:01','Completada en CONTIGO','2efeba68-a328-4d75-b8ca-13606a43b454'),(5,3,25,'2026-11-11 10:51:45','Completada en CONTIGO','a627452f-3b13-491d-8db3-792f1aacb610'),(6,3,27,'2026-11-11 10:52:18','Completada en CONTIGO','d4c76b00-379c-4ad2-a53c-c111ccb4bb07'),(7,3,4,'2026-11-11 17:44:04','Completada en CONTIGO','7751af8e-373f-4247-a8b0-0ad152ae5a0d'),(8,3,7,'2026-11-12 08:35:04','Completada en CONTIGO','b148788e-a2cf-4fcf-9a1c-f4936faea177'),(9,3,16,'2026-11-12 08:35:33','Completada en CONTIGO','3c27415b-6fdb-4ae3-89ca-0684e761e316'),(10,3,17,'2026-11-12 08:36:25','Completada en CONTIGO','9b53c8d3-410e-4e70-a26d-3f1c5eade23b'),(11,5,27,'2026-11-14 16:59:59','Completada en CONTIGO','8ba9615a-ae63-48a5-9a87-1e04bc21bfac'),(12,3,1,'2026-11-23 18:01:38','Completada en CONTIGO','9bda5e66-89bd-4c03-a1e0-4864547f13c8'),(13,3,8,'2026-11-23 22:52:30','Completada en CONTIGO','3a970ec0-7ee1-4166-81d2-4b5af0e81888');
/*!40000 ALTER TABLE `actividades_realizadas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Mandalas','Actividades interactivas de coloreado y creación de mandalas para favorecer la concentración y expresión emocional.'),(2,'Respiración','Actividades guiadas de respiración para ayudar a regular momentos de tensión o inquietud.'),(3,'Relajación','Actividades orientadas a disminuir la tensión y favorecer una sensación de calma.'),(4,'Movimiento','Actividades de movimiento corporal suave para favorecer el bienestar emocional.'),(5,'Creatividad','Actividades interactivas para crear, transformar y experimentar con diferentes recursos visuales.'),(6,'Arteterapia','Actividades de expresión artística mediante dibujo, pintura y otras formas creativas de representación emocional.');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cielo_bienestar`
--

DROP TABLE IF EXISTS `cielo_bienestar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cielo_bienestar` (
  `id_cielo` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `estrellas` int(11) DEFAULT 0,
  `constelaciones` int(11) DEFAULT 0,
  `ultima_actualizacion` datetime DEFAULT current_timestamp(),
  `figura_activa` varchar(40) NOT NULL DEFAULT 'corazon',
  PRIMARY KEY (`id_cielo`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `fk_cielo_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cielo_bienestar`
--

LOCK TABLES `cielo_bienestar` WRITE;
/*!40000 ALTER TABLE `cielo_bienestar` DISABLE KEYS */;
INSERT INTO `cielo_bienestar` VALUES (1,3,12,1,'2026-11-25 08:52:10','mariposa'),(27,5,1,0,'2026-11-14 17:27:43','corazon');
/*!40000 ALTER TABLE `cielo_bienestar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion_alertas`
--

DROP TABLE IF EXISTS `configuracion_alertas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracion_alertas` (
  `id_configuracion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `recordatorios_bienestar` tinyint(1) NOT NULL DEFAULT 0,
  `sugerencias_apoyo` tinyint(1) NOT NULL DEFAULT 0,
  `avisos_contacto_habilitados` tinyint(1) NOT NULL DEFAULT 0,
  `id_contacto` int(11) DEFAULT NULL,
  `fecha_autorizacion` datetime DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_configuracion`),
  UNIQUE KEY `unique_usuario_alertas` (`id_usuario`),
  KEY `fk_alertas_contacto` (`id_contacto`),
  CONSTRAINT `fk_alertas_contacto` FOREIGN KEY (`id_contacto`) REFERENCES `contactos_confianza` (`id_contacto`) ON DELETE SET NULL,
  CONSTRAINT `fk_alertas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_alertas`
--

LOCK TABLES `configuracion_alertas` WRITE;
/*!40000 ALTER TABLE `configuracion_alertas` DISABLE KEYS */;
INSERT INTO `configuracion_alertas` VALUES (1,3,1,1,1,6,'2026-11-25 09:41:12','2026-11-25 14:41:12');
/*!40000 ALTER TABLE `configuracion_alertas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `constelaciones_descubiertas`
--

DROP TABLE IF EXISTS `constelaciones_descubiertas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `constelaciones_descubiertas` (
  `id_descubrimiento` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `codigo_figura` varchar(40) NOT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_descubrimiento`),
  UNIQUE KEY `uq_usuario_figura` (`id_usuario`,`codigo_figura`),
  CONSTRAINT `fk_constelacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `constelaciones_descubiertas`
--

LOCK TABLES `constelaciones_descubiertas` WRITE;
/*!40000 ALTER TABLE `constelaciones_descubiertas` DISABLE KEYS */;
INSERT INTO `constelaciones_descubiertas` VALUES (1,3,'corazon','2026-11-12 08:35:04');
/*!40000 ALTER TABLE `constelaciones_descubiertas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contactos_confianza`
--

DROP TABLE IF EXISTS `contactos_confianza`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contactos_confianza` (
  `id_contacto` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `relacion` varchar(50) DEFAULT NULL,
  `correo` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id_contacto`),
  KEY `fk_contacto_usuario` (`id_usuario`),
  CONSTRAINT `fk_contacto_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contactos_confianza`
--

LOCK TABLES `contactos_confianza` WRITE;
/*!40000 ALTER TABLE `contactos_confianza` DISABLE KEYS */;
INSERT INTO `contactos_confianza` VALUES (2,3,'mama','3103283879','familiar',NULL),(5,3,'Yulieth Vertel','3132325196','Hermana',NULL),(6,3,'marilin osorio soler','3114507384','novia','marilintatiana2001@gmail.com');
/*!40000 ALTER TABLE `contactos_confianza` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversaciones`
--

DROP TABLE IF EXISTS `conversaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversaciones` (
  `id_conversacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `fecha_inicio` datetime DEFAULT current_timestamp(),
  `fecha_fin` datetime DEFAULT NULL,
  PRIMARY KEY (`id_conversacion`),
  KEY `fk_conversacion_usuario` (`id_usuario`),
  CONSTRAINT `fk_conversacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversaciones`
--

LOCK TABLES `conversaciones` WRITE;
/*!40000 ALTER TABLE `conversaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diario`
--

DROP TABLE IF EXISTS `diario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `diario` (
  `id_entrada` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(150) DEFAULT NULL,
  `contenido` text DEFAULT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_entrada`),
  KEY `fk_diario_usuario` (`id_usuario`),
  CONSTRAINT `fk_diario_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diario`
--

LOCK TABLES `diario` WRITE;
/*!40000 ALTER TABLE `diario` DISABLE KEYS */;
INSERT INTO `diario` VALUES (2,3,'prueba 2','prueba de escrito','2026-10-24 22:12:56'),(4,3,'Prueba 3','Estoy realizando la prueba de POST','2026-11-04 08:41:46'),(7,5,'LEN','M','2026-11-14 17:02:16');
/*!40000 ALTER TABLE `diario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emociones`
--

DROP TABLE IF EXISTS `emociones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `emociones` (
  `id_emocion` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `icono` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_emocion`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emociones`
--

LOCK TABLES `emociones` WRITE;
/*!40000 ALTER TABLE `emociones` DISABLE KEYS */;
INSERT INTO `emociones` VALUES (1,'Ansiedad','Sensación de preocupación, inquietud o nerviosismo difícil de controlar.','ansiedad'),(2,'Tristeza','Sensación de desánimo, vacío o falta de interés que puede afectar el bienestar.','tristeza'),(3,'Miedo','Sensación de temor, inseguridad o preocupación ante una situación.','miedo'),(4,'Soledad','Sensación de aislamiento, desconexión o falta de compañía.','soledad'),(5,'Enojo','Sensación de irritación, rabia o molestia ante una situación.','enojo'),(6,'Frustración','Sensación de impotencia, dificultad o molestia cuando algo no sale como se espera.','frustracion'),(7,'Culpa','Sensación de responsabilidad o arrepentimiento por algo ocurrido.','culpa'),(8,'Vergüenza','Sensación de incomodidad, inseguridad o deseo de ocultarse frente a una situación.','verguenza'),(9,'Estrés','Sensación de tensión física o mental ante situaciones que generan presión.','estres'),(10,'Angustia','Sensación intensa de malestar, preocupación o intranquilidad.','angustia'),(11,'Desesperanza','Sensación de falta de esperanza o dificultad para imaginar que una situación pueda mejorar.','desesperanza'),(12,'Vacío emocional','Sensación de vacío, desconexión o falta de satisfacción emocional.','vacio'),(13,'Inseguridad','Sensación de duda o falta de confianza en uno mismo o en las propias decisiones.','inseguridad'),(14,'Agobio','Sensación de estar sobrecargado emocional o mentalmente por las circunstancias.','agobio');
/*!40000 ALTER TABLE `emociones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensajes`
--

DROP TABLE IF EXISTS `mensajes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mensajes` (
  `id_mensaje` int(11) NOT NULL AUTO_INCREMENT,
  `id_conversacion` int(11) NOT NULL,
  `emisor` varchar(20) NOT NULL,
  `contenido` text NOT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_mensaje`),
  KEY `fk_mensaje_conversacion` (`id_conversacion`),
  CONSTRAINT `fk_mensaje_conversacion` FOREIGN KEY (`id_conversacion`) REFERENCES `conversaciones` (`id_conversacion`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensajes`
--

LOCK TABLES `mensajes` WRITE;
/*!40000 ALTER TABLE `mensajes` DISABLE KEYS */;
/*!40000 ALTER TABLE `mensajes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificaciones` (
  `id_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `tipo` varchar(40) NOT NULL,
  `titulo` varchar(120) NOT NULL,
  `mensaje` text NOT NULL,
  `enlace` varchar(160) DEFAULT NULL,
  `clave_evento` varchar(120) NOT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_lectura` datetime DEFAULT NULL,
  PRIMARY KEY (`id_notificacion`),
  UNIQUE KEY `uq_notificacion_evento` (`id_usuario`,`clave_evento`),
  KEY `idx_notificaciones_usuario` (`id_usuario`,`leida`,`fecha_creacion`),
  CONSTRAINT `fk_notificaciones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,3,'bienestar','Un momento para ti','Recuerda dedicar unos minutos a tu autocuidado. Puedes descansar, respirar con calma o realizar una actividad que disfrutes.',NULL,'prueba-campana-001',1,'2026-11-11 16:09:08','2026-11-11 16:10:39');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recuperacion_contrasenas`
--

DROP TABLE IF EXISTS `recuperacion_contrasenas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recuperacion_contrasenas` (
  `correo` varchar(150) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `codigo_hash` varchar(255) DEFAULT NULL,
  `codigo_expira` datetime DEFAULT NULL,
  `intentos` int(11) NOT NULL DEFAULT 0,
  `token_hash` char(64) DEFAULT NULL,
  `token_expira` datetime DEFAULT NULL,
  `ultimo_envio` datetime DEFAULT NULL,
  `ventana_inicio` datetime DEFAULT NULL,
  `envios_ventana` int(11) NOT NULL DEFAULT 0,
  `actualizado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recuperacion_contrasenas`
--

LOCK TABLES `recuperacion_contrasenas` WRITE;
/*!40000 ALTER TABLE `recuperacion_contrasenas` DISABLE KEYS */;
INSERT INTO `recuperacion_contrasenas` VALUES ('luisenriquevertelg9@gmail.com',3,NULL,NULL,0,NULL,NULL,'2026-11-18 19:30:27','2026-11-18 19:30:27',1,'2026-11-18 19:31:36');
/*!40000 ALTER TABLE `recuperacion_contrasenas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recursos_ayuda`
--

DROP TABLE IF EXISTS `recursos_ayuda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recursos_ayuda` (
  `id_recurso` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_recurso`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recursos_ayuda`
--

LOCK TABLES `recursos_ayuda` WRITE;
/*!40000 ALTER TABLE `recursos_ayuda` DISABLE KEYS */;
INSERT INTO `recursos_ayuda` VALUES (1,'Linea 106 - Apoyo emocional','Bogota. Servicio gratuito de escucha y orientacion emocional, disponible las 24 horas.','106','https://www.saludcapital.gov.co/Paginas2/llamanos_Linea106.aspx','Salud mental'),(2,'Linea 141 - Proteccion de menores','Colombia. Atencion gratuita para niños, niñas y adolescentes ante maltrato, abuso o vulneracion de sus derechos.','141','https://www.icbf.gov.co/linea-141','Proteccion'),(4,'Linea 155 - Orientacion ante violencia','Colombia. Orientacion gratuita las 24 horas para personas victimas de violencia basada en genero. Ofrece informacion sobre derechos, apoyo y rutas de atencion.','155','https://www.policia.gov.co/patrulla-purpura','Proteccion y orientacion');
/*!40000 ALTER TABLE `recursos_ayuda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registros_emocionales`
--

DROP TABLE IF EXISTS `registros_emocionales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registros_emocionales` (
  `id_registro` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_emocion` int(11) NOT NULL,
  `intensidad` int(11) NOT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp(),
  `nota` text DEFAULT NULL,
  PRIMARY KEY (`id_registro`),
  KEY `fk_registro_usuario` (`id_usuario`),
  KEY `fk_registro_emocion` (`id_emocion`),
  CONSTRAINT `fk_registro_emocion` FOREIGN KEY (`id_emocion`) REFERENCES `emociones` (`id_emocion`) ON UPDATE CASCADE,
  CONSTRAINT `fk_registro_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registros_emocionales`
--

LOCK TABLES `registros_emocionales` WRITE;
/*!40000 ALTER TABLE `registros_emocionales` DISABLE KEYS */;
INSERT INTO `registros_emocionales` VALUES (1,3,2,1,'2026-11-12 08:21:03',NULL),(2,3,3,3,'2026-11-12 08:34:52',NULL),(3,3,6,4,'2026-11-12 08:35:26',NULL),(4,3,6,5,'2026-11-12 08:36:15',NULL),(5,3,13,2,'2026-11-14 16:33:52',NULL),(6,5,9,5,'2026-11-14 16:59:21',NULL),(7,3,1,4,'2026-11-19 08:38:45',NULL),(8,3,1,5,'2026-11-19 08:44:48',NULL),(9,3,1,5,'2026-11-19 11:30:11',NULL),(10,3,1,3,'2026-11-23 17:57:55',NULL),(11,3,3,5,'2026-11-23 21:45:15',NULL),(12,3,11,4,'2026-11-23 21:47:11',NULL),(13,3,3,3,'2026-11-23 22:52:03',NULL);
/*!40000 ALTER TABLE `registros_emocionales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seguridad_diario`
--

DROP TABLE IF EXISTS `seguridad_diario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seguridad_diario` (
  `id_usuario` int(11) NOT NULL,
  `pin_hash` varchar(255) NOT NULL,
  `pista` varchar(120) DEFAULT NULL,
  `intentos` int(11) NOT NULL DEFAULT 0,
  `bloqueado_hasta` datetime DEFAULT NULL,
  `codigo_hash` varchar(255) DEFAULT NULL,
  `codigo_expira` datetime DEFAULT NULL,
  `codigo_intentos` int(11) NOT NULL DEFAULT 0,
  `ultimo_envio` datetime DEFAULT NULL,
  `autorizado_hasta` datetime DEFAULT NULL,
  `recuperacion_fallos` int(11) NOT NULL DEFAULT 0,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seguridad_diario`
--

LOCK TABLES `seguridad_diario` WRITE;
/*!40000 ALTER TABLE `seguridad_diario` DISABLE KEYS */;
INSERT INTO `seguridad_diario` VALUES (3,'scrypt:32768:8:1$yazSNO8XcF6KwjYH$ecfc124f05b9fd29c87fb9a2ae42ea1ce60102127886bea1c514306afc4ef5e1966ae1a97d7ceb9f84dc12fcebf34f43c1e2ae813f2a974faf8877fc948748c4','tussi',0,NULL,NULL,NULL,0,NULL,NULL,0,'2026-11-23 22:37:03');
/*!40000 ALTER TABLE `seguridad_diario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `rol` varchar(20) DEFAULT 'usuario',
  `pais_residencia` varchar(60) DEFAULT NULL,
  `genero_ian` varchar(30) DEFAULT NULL,
  `tratamiento_ian` varchar(20) DEFAULT NULL,
  `personalizacion_ian` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (3,'Luis Vertel','luisenriquevertelg9@gmail.com','scrypt:32768:8:1$dEosgctlM4K3YBKX$0fc518dc0714ec0e3966e4b8e32e6cb8e70c4c009f9f6338ab4fdbf7f4c51d15a378fb1b3ff0c9658c447bd306f2361815aee6262d9ff930f915c0da9770384a','2003-11-08','2026-10-24 15:35:03','usuario',NULL,NULL,'femenino',1),(4,'marilin osorio soler','marilintatiana2001@gmail.com','scrypt:32768:8:1$k5oZnCCKGD5nE42i$d7af2b6e239ab0952a34152c9215b4834b402ef9b108bedce12aa2bac3bdb7ff0ce0262c58cd3db6393804a39ecd08b72232e162f9a352bde8c7f9aaa0484b07','2001-05-07','2026-11-11 10:04:12','usuario',NULL,NULL,NULL,0),(5,'DANY YULIETH VERTEL GUERRA','daniyuliethvertelguerra@gmail.com','scrypt:32768:8:1$bKfzhE8bWOOK9K0f$02669b350ca7b58ba76536266ac7a7b65f3a9acbd811a782d4ed9c92d4ce311b188c8fac847a04698f07731892aab38660a25148238012ec08e1035a746f68a7','2006-10-10','2026-11-14 16:57:05','usuario',NULL,NULL,NULL,0),(7,'Diego Osorio','daol8121@gmail.com','scrypt:32768:8:1$xxEjtzvKtEgKII0L$aebd9f021c1d7eb0198f430b7741ca054444f08629cbe9761ddafda01c1214d791395f1e80036f54aa7b6caf9295877b60625b4f7d77f979d574d66cde632a66','2001-05-07','2026-11-22 16:40:18','usuario',NULL,NULL,NULL,0),(10,'Diana Soler','dianisol06@hotmail.com','scrypt:32768:8:1$bghf4efDw4XpuxLM$3d9c4a20f28426ca69144dd85bb19eed25c9c087a82145aba96f0a2487b0b6424e3f0af1d0eabc27a92a07c475577a9a155cbdca9ee73d2ff790213199d20003','1995-01-06','2026-11-22 16:44:13','usuario',NULL,NULL,NULL,0),(11,'Silvia Guerra','silviaelenaguerragarcia@gmail.com','scrypt:32768:8:1$MACkwUtxFVGMTcUj$4ba612afa7eb7ca849077b7e9d6f39bc68cffa845b18d8ff2b1d6551e2f1a34df0e03385567b0795272e386a2ac70572c724548f4124750cb56cd1825aa6819e','1986-07-11','2026-11-22 16:48:18','usuario',NULL,NULL,NULL,0),(12,'Luis','lvertehf@gmail.com','scrypt:32768:8:1$gdvaEKXJRDQ8KGNL$7bcd8964fce737cb52028ec752c1734500f0becad67801b557a0155cb2c1c67c48e5c4f6db3bc906b2fcee9559518f71c903ec8cd38115ceeba40cf372aa940d','2003-08-11','2026-11-22 16:55:09','usuario','colombia','hombre','femenino',1);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'contigo_db'
--

--
-- Dumping routines for database 'contigo_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-25 11:12:37
