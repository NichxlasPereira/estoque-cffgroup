# Estoque CFFGROUP

Sistema web de controle de estoque de materiais de escritório para uso interno de equipe (múltiplos usuários simultâneos).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 6 + SQLite (dados persistidos em `prisma/dev.db`)
- react-hot-toast para notificações

## Como rodar

Pré-requisito: Node.js 20+.

```bash
npm install
npm run dev
```

Na primeira execução, o banco de dados é criado automaticamente (migração do Prisma) e populado com materiais e retiradas de exemplo. Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — aplica migrações pendentes, roda o seed (se o banco estiver vazio) e inicia o servidor de desenvolvimento.
- `npm run build` — aplica migrações pendentes e gera o build de produção.
- `npm run start` — inicia o servidor em modo produção (após `build`).
- `npm run lint` — roda o ESLint.

## Modelo de dados

- **Material**: nome, categoria, unidade, quantidade, estoque mínimo, local, fornecedor, preço e link de compra.
- **Retirada**: cópia dos dados do material no momento da retirada (para manter o histórico legível mesmo após edição ou exclusão do material), quantidade, data e responsável.

Excluir um material não apaga o histórico de retiradas associado a ele.
