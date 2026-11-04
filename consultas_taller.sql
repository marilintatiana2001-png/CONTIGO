
-- ==========================================
-- CONTIGO - TALLER SENA
-- EVIDENCIAS DE BASE DE DATOS
-- ==========================================

USE contigo_db;

-- 1. Consultar todos los escritos registrados

SELECT
    id_entrada,
    id_usuario,
    titulo,
    contenido,
    fecha_hora
FROM diario
ORDER BY id_entrada DESC;


-- 2. Consultar el registro creado desde React

SELECT
    id_entrada,
    id_usuario,
    titulo,
    contenido,
    fecha_hora
FROM diario
WHERE id_entrada = 6;


-- 3. Contar los escritos registrados

SELECT COUNT(*) AS total_escritos
FROM diario;


-- 4. Comprobar la entidad utilizada

DESCRIBE diario;
