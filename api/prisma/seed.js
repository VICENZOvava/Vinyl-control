require('dotenv').config();

const prisma = require('../src/data/prisma');

async function main() {
  const usuario1 = await prisma.uSUARIO.upsert({
    where: { email: 'admin@vinis.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@vinis.com',
      senha: '123456',
    },
  });

  const usuario2 = await prisma.uSUARIO.upsert({
    where: { email: 'joao@vinis.com' },
    update: {},
    create: {
      nome: 'João Silva',
      email: 'joao@vinis.com',
      senha: '123456',
    },
  });

  const discos = [
    {
      titulo: 'Abbey Road',
      artista: 'The Beatles',
      genero: 'Rock',
      preco_custo: 80.00,
      preco_venda: 120.00,
      quantidade_estoque: 10,
      estoque_minimo: 3,
    },
    {
      titulo: 'Thriller',
      artista: 'Michael Jackson',
      genero: 'Pop',
      preco_custo: 70.00,
      preco_venda: 110.00,
      quantidade_estoque: 8,
      estoque_minimo: 2,
    },
    {
      titulo: 'The Dark Side of the Moon',
      artista: 'Pink Floyd',
      genero: 'Rock',
      preco_custo: 90.00,
      preco_venda: 140.00,
      quantidade_estoque: 5,
      estoque_minimo: 2,
    },
    {
      titulo: '1989',
      artista: 'Taylor Swift',
      genero: 'Pop',
      preco_custo: 65.00,
      preco_venda: 100.00,
      quantidade_estoque: 2,
      estoque_minimo: 4,
    },
  ];

  const discosCriados = [];

  for (const disco of discos) {
    const registro = await prisma.dISCO.create({
      data: disco,
    });

    discosCriados.push(registro);
  }

  await prisma.mOVIMENTACAO_ESTOQUE.createMany({
    data: [
      {
        id_disco: discosCriados[0].id_disco,
        id_usuario: usuario1.id_usuario,
        tipo_movimentacao: 'entrada',
        quantidade: 10,
        data_movimentacao: new Date('2026-10-20'),
        observacao: 'Estoque inicial',
      },
      {
        id_disco: discosCriados[1].id_disco,
        id_usuario: usuario1.id_usuario,
        tipo_movimentacao: 'entrada',
        quantidade: 8,
        data_movimentacao: new Date('2026-10-20'),
        observacao: 'Estoque inicial',
      },
      {
        id_disco: discosCriados[2].id_disco,
        id_usuario: usuario2.id_usuario,
        tipo_movimentacao: 'entrada',
        quantidade: 5,
        data_movimentacao: new Date('2026-10-21'),
        observacao: 'Reposição de estoque',
      },
      {
        id_disco: discosCriados[3].id_disco,
        id_usuario: usuario2.id_usuario,
        tipo_movimentacao: 'saida',
        quantidade: 1,
        data_movimentacao: new Date('2026-10-22'),
        observacao: 'Venda de disco',
      },
    ],
  });

  console.log('Seed executado com sucesso!');
  console.log('Usuários:', usuario1.email, usuario2.email);
  console.log(`Discos cadastrados: ${discosCriados.length}`);
  console.log('Movimentações cadastradas: 4');
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  