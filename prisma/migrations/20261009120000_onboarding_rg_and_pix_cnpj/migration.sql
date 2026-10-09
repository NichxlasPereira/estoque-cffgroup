-- Onboardings em andamento cujo candidato ainda não enviou os dados passam a
-- pedir o RG (logo depois do CPF) e a Chave Pix como CNPJ. Quem já enviou os
-- dados não é alterado.
CREATE TEMP TABLE "_alvo" AS
  SELECT "id" FROM "Admission" WHERE "status" = 'em_andamento' AND "submittedAt" IS NULL;

UPDATE "AdmissionField"
SET "label" = 'Chave Pix (CNPJ)', "type" = 'cnpj', "updatedAt" = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE "key" = 'pix' AND "value" IS NULL AND "admissionId" IN (SELECT "id" FROM "_alvo");

-- Abre espaço logo depois do CPF...
UPDATE "AdmissionField"
SET "sortOrder" = "sortOrder" + 1
WHERE "admissionId" IN (SELECT "id" FROM "_alvo")
  AND NOT EXISTS (SELECT 1 FROM "AdmissionField" r WHERE r."admissionId" = "AdmissionField"."admissionId" AND r."key" = 'rg')
  AND "sortOrder" > (SELECT c."sortOrder" FROM "AdmissionField" c WHERE c."admissionId" = "AdmissionField"."admissionId" AND c."key" = 'cpf');

-- ...e coloca o RG ali.
INSERT INTO "AdmissionField" ("id", "admissionId", "key", "label", "type", "required", "sortOrder", "value", "createdAt", "updatedAt")
SELECT 'rg' || lower(hex(randomblob(11))), c."admissionId", 'rg', 'RG', 'rg', true, c."sortOrder" + 1, NULL,
       CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000
FROM "AdmissionField" c
WHERE c."key" = 'cpf' AND c."admissionId" IN (SELECT "id" FROM "_alvo")
  AND NOT EXISTS (SELECT 1 FROM "AdmissionField" r WHERE r."admissionId" = c."admissionId" AND r."key" = 'rg');

DROP TABLE "_alvo";
