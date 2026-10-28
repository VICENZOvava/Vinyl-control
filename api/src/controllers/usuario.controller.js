const prisma = require("../data/prisma");

const cadastrar = async (req, res) => {
    const item = await prisma.uSUARIO.create({ data: req.body });
    return res.status(201).json(item);
};

const listar = async (req, res) => {
    const lista = await prisma.uSUARIO.findMany();
    return res.status(200).json(lista);
};

const buscar = async (req, res) => {
    const { id } = req.params;
    const item = await prisma.uSUARIO.findUnique({
        where: { id_usuario: Number(id) }
    });
    return res.status(200).json(item);
};

const atualizar = async (req, res) => {
    const { id } = req.params;
    const item = await prisma.uSUARIO.update({
        where: { id_usuario: Number(id) },
        data: req.body
    });
    return res.status(200).json(item);
};

const excluir = async (req, res) => {
    const { id } = req.params;
    const item = await prisma.uSUARIO.delete({
        where: { id_usuario: Number(id) }
    });
    return res.status(200).json(item);
};

const autenticar = async (req, res) => {
    const { email, senha } = req.body || {};

    if (typeof email !== "string" || typeof senha !== "string" || !email.trim() || !senha) {
        return res.status(400).json({ message: "Informe um e-mail e uma senha." });
    }

    try {
        const usuario = await prisma.uSUARIO.findUnique({
            where: { email: email.trim() }
        });

        if (!usuario || usuario.senha !== senha) {
            return res.status(401).json({ message: "E-mail ou senha incorretos." });
        }

        return res.status(200).json({
            usuario: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    } catch (error) {
        console.error("Erro ao autenticar usuário:", error);
        return res.status(500).json({ message: "Não foi possível autenticar agora." });
    }
};

module.exports = { cadastrar, listar, buscar, atualizar, excluir, autenticar };
