const prisma = require("../data/prisma");

const cadastrar = async (req, res) => {
    const item = await prisma.dISCO.create({ data: req.body });
    return res.status(201).json(item);
};

const listar = async (req, res) => {
    const lista = await prisma.dISCO.findMany({
        where: { ativo: true }
    });
    return res.status(200).json(lista);
};

const buscar = async (req, res) => {
    const { id } = req.params;
    const item = await prisma.dISCO.findUnique({
        where: { id_disco: Number(id) }
    });
    return res.status(200).json(item);
};

const atualizar = async (req, res) => {
    const { id } = req.params;
    const item = await prisma.dISCO.update({
        where: { id_disco: Number(id) },
        data: req.body
    });
    return res.status(200).json(item);
};

const excluir = async (req, res) => {
    const { id } = req.params;
    const item = await prisma.dISCO.update({
        where: { id_disco: Number(id) },
        data: { ativo: false }
    });
    return res.status(200).json(item);
};

module.exports = { cadastrar, listar, buscar, atualizar, excluir };
