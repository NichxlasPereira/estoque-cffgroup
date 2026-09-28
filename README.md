# Estoque CFFGROUP

Sistema web interno da CFFGROUP (múltiplos usuários simultâneos) com dois módulos:

- **Estoque** (`/`) — materiais de escritório, retiradas e relatórios de consumo.
- **Frequência** (`/frequencia`) — atrasos, faltas e atestados dos colaboradores, com filtros por mês/setor, exportação CSV e relatórios mensais.

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

- **Colaborador**: nome, setor, cargo e se está ativo (inativos somem da lista ao registrar novas ocorrências, mas o histórico continua).
- **Ocorrência**: tipo (`atraso`, `falta` ou `atestado`), data inicial e final (atestados podem cobrir vários dias), minutos de atraso, se foi justificada e observações. Guarda uma cópia do nome e setor do colaborador, como as retiradas fazem com o material.

Excluir um material não apaga o histórico de retiradas associado a ele; excluir um colaborador também preserva suas ocorrências.

Atestados são dados de saúde (LGPD): o sistema não tem campo de CID/diagnóstico de propósito.
