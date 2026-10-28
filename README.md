# Vinyl Control - Julia Novo e Vicenzo Vieira Varandas

Sistema web para administrar um catálogo de discos de vinil e acompanhar o estoque. A aplicação oferece uma visão geral do acervo, cadastro e busca de discos, registro de entradas e vendas, além de histórico de movimentações.

## Funcionalidades

- Login de usuários cadastrados.
- Painel com quantidade de discos, unidades em estoque e itens abaixo do mínimo.
- Cadastro, consulta, edição, busca e exclusão de discos. A exclusão é lógica: o disco fica inativo e as movimentações associadas permanecem no banco.
- Registro de entradas e saídas com data, quantidade e observação opcional.
- Aviso quando uma saída deixa o estoque abaixo do mínimo configurado.
- Cadastro e consulta de usuários e movimentações pela API.

## Tecnologias

- Interface: HTML, CSS e JavaScript sem framework.
- API: Node.js e Express.
- Banco de dados: MySQL ou MariaDB.
- Prisma com MariaDB.

## Configuração e execução

1. Crie um banco de dados.

2. Na pasta `api`, crie um arquivo `.env` com a URL de conexão. Ajuste usuário, senha, host e nome do banco conforme seu ambiente:

   ```env
   DATABASE_URL="mysql://usuario:senha@localhost:3306/vinyl_control"
   PORT=3000
   ```

3. Instale as dependências e prepare o banco, executando os comandos dentro de `api`:

   ```bash
   cd api
   npm install
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   ```

4. Inicie a API, ainda na pasta `api`:

   ```bash
   npm run dev
   ```

   A API ficará disponível em `http://localhost:3000` por padrão. A variável `PORT` altera essa porta.

## Dados de demonstração

O seed tem dois usuários de exemplo:

| E-mail | Senha |
| --- | --- |
| `admin@vinis.com` | `123456` |
| `joao@vinis.com` | `123456` |

