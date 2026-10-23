# Tavariando — Almoço em Família

Aplicação web para organizar o almoço em família: confirmação de presença, divisão do cardápio em travessas/porções, pratos adicionais, transparência das cotas e ajuda de custo via Pix.

Construída com **Next.js 16 (App Router e Cache Components)**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Prisma 7** e **Turso/LibSQL**.

## Funcionalidades

- Confirmação de presença com acompanhantes e opção de levar bebida própria.
- Divisão do cardápio em travessas/panelas com limite sugerido conforme o número de pessoas.
- Pratos adicionais, doces, frutas e petiscos na "mesa de gostosuras".
- Painel público de transparência com quem já assumiu cada item.
- Card de ajuda de custo com chave Pix e atalho para o WhatsApp da organização.
- Sessão por token para editar ou cancelar a própria confirmação com segurança.

## Pré-requisitos

- **Node.js 20.9+** (recomendado 22 LTS ou superior)
- **npm 10+**
- Conta no [Turso](https://turso.tech) (ou SQLite local para desenvolvimento)

## Instalação passo a passo

1. Clone o repositório:

   ```bash
   git clone https://github.com/Rilen/Tavariando.git
   cd Tavariando
   ```

2. Instale as dependências (o `postinstall` roda `prisma generate`):

   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env.local
   ```

   Preencha `DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NEXT_PUBLIC_PIX_KEY` e `NEXT_PUBLIC_WHATSAPP_URL`.

   Para desenvolvimento local com arquivo SQLite, use:

   ```env
   DATABASE_URL="file:./dev.db"
   ```

4. Gere o Prisma Client, se necessário:

   ```bash
   npx prisma generate
   ```

5. Prepare o banco e os itens iniciais:

   ```bash
   npm run db:push   # cria as tabelas no banco local
   npm run db:seed   # cadastra os itens do cardápio
   ```

   Para sincronizar o schema em um banco Turso remoto:

   ```bash
   npm run db:sync
   ```

6. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

## Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento. |
| `npm run build` | Build de produção. O `prebuild` sincroniza o schema do banco antes de compilar. |
| `npm run start` | Executa o build de produção. |
| `npm run lint` | ESLint (o Next 16 não usa mais `next lint`). |
| `npm run typecheck` | Verificação de tipos com `tsc --noEmit`. |
| `npm run db:generate` | Gera o Prisma Client. |
| `npm run db:push` | Aplica o schema no banco local (SQLite). |
| `npm run db:sync` | Sincroniza o schema no Turso remoto. |
| `npm run db:seed` | Popula os itens iniciais do cardápio. |
| `npm run db:studio` | Abre o Prisma Studio. |

## Arquitetura e segurança

- **Sessão por token:** cada confirmação recebe um token aleatório cujo hash SHA-256 é salvo no banco. Editar ou cancelar exige o token guardado no `localStorage`; IDs públicos não permitem alterar dados de terceiros.
- **Validação estrita (Zod):** nome, WhatsApp, acompanhantes, descrição do prato adicional e IDs de itens passam por validação e sanitização, com limite de payload de `256kb` nas Server Actions.
- **Rate limiting e honeypot:** limite de 5 confirmações por minuto e 10 cancelamentos por minuto por IP, além de campo oculto que descarta bots sem tocar no banco.
- **Cache de leitura:** o dashboard usa `"use cache"` com `cacheTag("dashboard")`; as mutações invalidam com `revalidateTag`/`revalidatePath`, reduzindo leituras na quota do Turso.
- **Concorrência:** a capacidade de cada item é validada dentro de `prisma.$transaction`, evitando ultrapassar o limite de voluntários.
- **Cabeçalhos de segurança:** CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy` configurados em `next.config.ts`.

## Deploy na Vercel

1. Configure as variáveis de ambiente no projeto da Vercel: `DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NEXT_PUBLIC_PIX_KEY` e `NEXT_PUBLIC_WHATSAPP_URL`.
2. O `prebuild` executa `scripts/sync-db.mjs`, garantindo o schema no Turso antes do build.
3. Faça o deploy da branch `main`.

## Estrutura do projeto

```
prisma/            schema, seed e configuração do Prisma
scripts/           sincronização de schema (SQLite/Turso) e carga de env
src/app/           App Router (page, actions, icon, loading, error)
src/components/    componentes de interface
src/lib/           prisma, validação, rate limit, cache, sessão e utilitários
public/            assets estáticos
```
