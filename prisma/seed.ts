import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

async function main() {
  const existing = await prisma.material.count();
  if (existing > 0) {
    console.log("Banco já possui dados — seed ignorado.");
    return;
  }

  const materials = await prisma.$transaction([
    prisma.material.create({
      data: {
        name: "Papel A4",
        category: "Papelaria",
        unit: "resma",
        quantity: 40,
        minQuantity: 10,
        location: "Almoxarifado - Prateleira A1",
        supplier: "Kalunga",
        price: 24.9,
        purchaseLink: "https://www.kalunga.com.br/",
      },
    }),
    prisma.material.create({
      data: {
        name: "Caneta esferográfica azul",
        category: "Papelaria",
        unit: "unidade",
        quantity: 8,
        minQuantity: 20,
        location: "Almoxarifado - Prateleira A2",
        supplier: "Kalunga",
        price: 1.5,
      },
    }),
    prisma.material.create({
      data: {
        name: "Grampeador",
        category: "Papelaria",
        unit: "unidade",
        quantity: 3,
        minQuantity: 2,
        location: "Almoxarifado - Prateleira A3",
        supplier: "Kalunga",
        price: 18.9,
      },
    }),
    prisma.material.create({
      data: {
        name: "Detergente neutro",
        category: "Limpeza",
        unit: "frasco",
        quantity: 0,
        minQuantity: 5,
        location: "Almoxarifado - Prateleira B1",
        supplier: "Distribuidora Higine",
        price: 4.5,
      },
    }),
    prisma.material.create({
      data: {
        name: "Álcool em gel",
        category: "Limpeza",
        unit: "frasco",
        quantity: 4,
        minQuantity: 8,
        location: "Almoxarifado - Prateleira B2",
        supplier: "Distribuidora Higine",
        price: 12.0,
        purchaseLink: "https://www.amazon.com.br/",
      },
    }),
    prisma.material.create({
      data: {
        name: "Papel toalha",
        category: "Copa e Cozinha",
        unit: "pacote",
        quantity: 15,
        minQuantity: 10,
        location: "Copa - Armário 1",
        supplier: "Atacadão",
        price: 9.9,
      },
    }),
    prisma.material.create({
      data: {
        name: "Café em pó",
        category: "Copa e Cozinha",
        unit: "pacote",
        quantity: 2,
        minQuantity: 5,
        location: "Copa - Armário 2",
        supplier: "Atacadão",
        price: 14.5,
      },
    }),
    prisma.material.create({
      data: {
        name: "Mouse USB",
        category: "TI e Periféricos",
        unit: "unidade",
        quantity: 12,
        minQuantity: 5,
        location: "TI - Armário de suprimentos",
        supplier: "Kabum",
        price: 39.9,
        purchaseLink: "https://www.kabum.com.br/",
      },
    }),
    prisma.material.create({
      data: {
        name: "Cabo HDMI",
        category: "TI e Periféricos",
        unit: "unidade",
        quantity: 0,
        minQuantity: 4,
        location: "TI - Armário de suprimentos",
        supplier: "Kabum",
        price: 22.0,
        purchaseLink: "https://www.kabum.com.br/",
      },
    }),
    prisma.material.create({
      data: {
        name: "Cadeira de escritório",
        category: "Mobiliário",
        unit: "unidade",
        quantity: 6,
        minQuantity: 2,
        location: "Depósito - Setor Mobiliário",
        supplier: "Madesa",
        price: 459.0,
      },
    }),
  ]);

  const [papelA4, caneta, , , alcool, , cafe, mouse] = materials;

  await prisma.$transaction([
    prisma.withdrawal.create({
      data: {
        materialId: papelA4.id,
        materialName: papelA4.name,
        category: papelA4.category,
        unit: papelA4.unit,
        quantity: 2,
        date: daysAgo(1),
        withdrawnBy: "Mariana Souza",
      },
    }),
    prisma.withdrawal.create({
      data: {
        materialId: caneta.id,
        materialName: caneta.name,
        category: caneta.category,
        unit: caneta.unit,
        quantity: 12,
        date: daysAgo(2),
        withdrawnBy: "João Pedro",
      },
    }),
    prisma.withdrawal.create({
      data: {
        materialId: cafe.id,
        materialName: cafe.name,
        category: cafe.category,
        unit: cafe.unit,
        quantity: 3,
        date: daysAgo(3),
        withdrawnBy: "Fernanda Lima",
      },
    }),
    prisma.withdrawal.create({
      data: {
        materialId: mouse.id,
        materialName: mouse.name,
        category: mouse.category,
        unit: mouse.unit,
        quantity: 1,
        date: daysAgo(5),
        withdrawnBy: "Carlos Eduardo",
      },
    }),
    prisma.withdrawal.create({
      data: {
        materialId: alcool.id,
        materialName: alcool.name,
        category: alcool.category,
        unit: alcool.unit,
        quantity: 4,
        date: daysAgo(6),
        withdrawnBy: "Mariana Souza",
      },
    }),
    prisma.withdrawal.create({
      data: {
        materialId: papelA4.id,
        materialName: papelA4.name,
        category: papelA4.category,
        unit: papelA4.unit,
        quantity: 1,
        date: daysAgo(12),
        withdrawnBy: "João Pedro",
      },
    }),
  ]);

  console.log("Seed concluído com sucesso.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
