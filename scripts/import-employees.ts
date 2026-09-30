/**
 * Importa colaboradores em lote (um nome por linha, lidos da entrada padrão).
 *
 *   npx tsx scripts/import-employees.ts --dry-run < nomes.txt   # só mostra o que faria
 *   npx tsx scripts/import-employees.ts < nomes.txt             # grava
 *
 * Não duplica: compara nomes sem diferenciar maiúsculas, acentos e espaços
 * extras. Quem já existe e está inativo volta a ficar ativo. A lista de nomes
 * nunca deve ser versionada (o repositório é público).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function nameKey(name: string): string {
  return cleanName(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const names = (await readStdin()).split(/\r?\n/).map(cleanName).filter(Boolean);

  const existing = await prisma.employee.findMany();
  const byKey = new Map(existing.map((e) => [nameKey(e.name), e]));

  const toCreate: string[] = [];
  const toReactivate: string[] = [];
  const alreadyActive: string[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    const key = nameKey(name);
    if (seen.has(key)) continue; // repetido na própria lista
    seen.add(key);
    const match = byKey.get(key);
    if (!match) toCreate.push(name);
    else if (!match.active) toReactivate.push(match.name);
    else alreadyActive.push(match.name);
  }

  // Cadastros existentes que não batem exatamente, mas cujo nome inteiro
  // aparece dentro de um nome da lista (ex.: "nicholas" x "Nicholas Pereira Feitosa").
  const possibleDuplicates = existing
    .filter((e) => !seen.has(nameKey(e.name)))
    .flatMap((e) => {
      const tokens = nameKey(e.name).split(" ");
      const similar = toCreate.filter((n) => {
        const target = new Set(nameKey(n).split(" "));
        return tokens.every((t) => target.has(t));
      });
      return similar.map((n) => `"${e.name}" parece ser "${n}"`);
    });

  console.log(`Nomes na lista: ${names.length} (${seen.size} distintos)`);
  console.log(`Cadastrar: ${toCreate.length}`);
  console.log(`Reativar: ${toReactivate.length}${toReactivate.length ? ` — ${toReactivate.join(", ")}` : ""}`);
  console.log(`Já ativos (ignorados): ${alreadyActive.length}${alreadyActive.length ? ` — ${alreadyActive.join(", ")}` : ""}`);
  if (possibleDuplicates.length) console.log(`Possíveis duplicados para revisar: ${possibleDuplicates.join("; ")}`);

  if (dryRun) {
    console.log("Simulação: nada foi gravado.");
    return;
  }

  await prisma.$transaction([
    ...toCreate.map((name) => prisma.employee.create({ data: { name, active: true } })),
    ...toReactivate.map((name) => prisma.employee.updateMany({ where: { name }, data: { active: true } })),
  ]);
  console.log("Importação concluída.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
