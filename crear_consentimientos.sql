CREATE TABLE IF NOT EXISTS consentimientos_usuario (
    id_consentimiento BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo_consentimiento VARCHAR(50) NOT NULL,
    version_documento VARCHAR(20) NOT NULL,
    aceptado TINYINT(1) NOT NULL,
    fecha_decision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consentimientos_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);
