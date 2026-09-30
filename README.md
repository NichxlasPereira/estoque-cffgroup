# Estoque CFFGROUP

Sistema web interno da CFFGROUP (múltiplos usuários simultâneos) com dois módulos:

- **Estoque** (`/`) — materiais de escritório, retiradas e relatórios de consumo.
- **Frequência** (`/frequencia`) — atrasos, faltas, atestados e folgas dos colaboradores, com filtros por mês/setor, exportação CSV e relatórios mensais.

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

## Acesso aos módulos

Tudo fica atrás da autenticação geral do site (`BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD`). Além disso:

**Estoque** — senha compartilhada da equipe, na variável `ESTOQUE_PASSWORD` (tela `/entrar`). Sem a variável, o estoque fica bloqueado.

**Frequência (RH)** — privada: **contas individuais**, cada pessoa com o próprio e-mail e senha (tela `/frequencia/entrar`). O link "frequência" nem aparece no estoque para quem não tem acesso.

1. **Primeiro acesso:** enquanto não existe nenhuma conta, a tela de entrada pede a *chave de primeiro acesso* — o valor de `FREQUENCIA_PASSWORD` no servidor — e cria a conta de **administrador**. Depois disso a chave não abre mais nada.
2. **Liberar acesso:** o administrador, na aba **acessos**, cadastra nome, e-mail, uma senha inicial e o perfil (*Acesso* ou *Administrador*). A pessoa troca a senha em "minha senha".
3. **Tirar acesso:** bloquear, redefinir a senha ou remover encerra as sessões da pessoa na hora. O sistema sempre mantém pelo menos um administrador ativo.

Senhas são guardadas só como hash (scrypt); sessões duram 12 horas e ficam registradas no banco (o navegador guarda só um token aleatório). A verificação de acesso é feita em cada rota da API, não só no proxy.

## Modelo de dados

- **Material**: nome, categoria, unidade, quantidade, estoque mínimo, local, fornecedor, preço e link de compra.
- **Retirada**: cópia dos dados do material no momento da retirada (para manter o histórico legível mesmo após edição ou exclusão do material), quantidade, data e responsável.

- **Acesso à frequência**: nome, e-mail, hash da senha, perfil (administrador ou acesso), se está ativo e último acesso; mais as sessões abertas.
- **Colaborador**: nome, setor, cargo, total de folgas a que tem direito e se está ativo (inativos somem da lista ao registrar novas ocorrências, mas o histórico continua).
- **Ocorrência**: tipo (`atraso`, `falta`, `atestado` ou `folga`), data inicial e final (atestados e folgas podem cobrir vários dias), minutos de atraso, se foi justificada, gestor que concedeu (folga) e observações. O saldo de folgas é o total do colaborador menos os dias de folga já lançados; a API recusa folgas acima do saldo. Guarda uma cópia do nome e setor do colaborador, como as retiradas fazem com o material.

Excluir um material não apaga o histórico de retiradas associado a ele; excluir um colaborador também preserva suas ocorrências.

Atestados são dados de saúde (LGPD): o sistema não tem campo de CID/diagnóstico de propósito.

**Anexos de atestado**: PDF ou imagem (JPG, PNG, WEBP, HEIC), até 10 MB cada. Os arquivos ficam em disco numa pasta `atestados` ao lado do banco SQLite — localmente `prisma/atestados/` (fora do git), em produção no mesmo volume do banco. Para usar outra pasta, defina `ATTACHMENTS_DIR`. Só são servidos pela API, atrás da mesma autenticação do site.
