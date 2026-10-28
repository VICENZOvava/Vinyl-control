-- CreateTable
CREATE TABLE `USUARIO` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `senha` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `USUARIO_email_key`(`email`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DISCO` (
    `id_disco` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(150) NULL,
    `artista` VARCHAR(100) NULL,
    `genero` VARCHAR(50) NULL,
    `preco_custo` DECIMAL(10, 2) NULL,
    `preco_venda` DECIMAL(10, 2) NULL,
    `quantidade_estoque` INTEGER NULL,
    `estoque_minimo` INTEGER NULL,

    PRIMARY KEY (`id_disco`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MOVIMENTACAO_ESTOQUE` (
    `id_movimentacao` INTEGER NOT NULL AUTO_INCREMENT,
    `id_disco` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `tipo_movimentacao` ENUM('entrada', 'saida') NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `data_movimentacao` DATE NOT NULL,
    `observacao` VARCHAR(250) NULL,

    PRIMARY KEY (`id_movimentacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MOVIMENTACAO_ESTOQUE` ADD CONSTRAINT `MOVIMENTACAO_ESTOQUE_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `USUARIO`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MOVIMENTACAO_ESTOQUE` ADD CONSTRAINT `MOVIMENTACAO_ESTOQUE_id_disco_fkey` FOREIGN KEY (`id_disco`) REFERENCES `DISCO`(`id_disco`) ON DELETE RESTRICT ON UPDATE CASCADE;
