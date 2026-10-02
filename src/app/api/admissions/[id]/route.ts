import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFrequenciaUser } from "@/lib/frequenciaAccess";
import { removeAttachmentFiles } from "@/lib/attachmentStorage";
import { ADMISSION_INCLUDE, publicAdmission } from "@/lib/admissionServer";
import { parseAdmissionFields } from "@/lib/admissionValidation";
import { admissionProgress } from "@/lib/admission";

function nameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Edita os dados ou muda a situação da admissão:
 * { action: "concluir" } — exige todos os documentos obrigatórios aprovados e
 *   cria (ou reativa) o colaborador;
 * { action: "cancelar" } / { action: "reabrir" }.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const admission = await prisma.admission.findUnique({ where: { id }, include: ADMISSION_INCLUDE });
  if (!admission) return NextResponse.json({ error: "Onboarding não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === "cancelar" || action === "reabrir") {
    if (admission.status === "concluida") {
      return NextResponse.json({ error: "Um onboarding concluído não pode ser alterado." }, { status: 409 });
    }
    const updated = await prisma.admission.update({
      where: { id },
      data: { status: action === "cancelar" ? "cancelada" : "em_andamento" },
      include: ADMISSION_INCLUDE,
    });
    return NextResponse.json(publicAdmission(updated));
  }

  if (action === "concluir") {
    if (admission.status !== "em_andamento") {
      return NextResponse.json({ error: "Só onboardings em andamento podem ser concluídos." }, { status: 409 });
    }
    const progress = admissionProgress(admission.documents.map((d) => ({ required: d.required, status: d.status as never })));
    if (progress.approved < progress.required) {
      return NextResponse.json(
        { error: `Ainda faltam ${progress.required - progress.approved} documento(s) obrigatório(s) aprovado(s).` },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Se já existe colaborador com o mesmo nome, reaproveita em vez de duplicar.
      const employees = await tx.employee.findMany({ select: { id: true, name: true } });
      const existing = employees.find((e) => nameKey(e.name) === nameKey(admission.candidateName));
      const employeeId = existing
        ? (await tx.employee.update({ where: { id: existing.id }, data: { active: true } })).id
        : (
            await tx.employee.create({
              data: {
                name: admission.candidateName.trim().replace(/\s+/g, " "),
                department: admission.department,
                role: admission.role,
                active: true,
              },
            })
          ).id;
      return tx.admission.update({
        where: { id },
        data: { status: "concluida", employeeId },
        include: ADMISSION_INCLUDE,
      });
    });
    return NextResponse.json(publicAdmission(updated));
  }

  const fields = parseAdmissionFields(body);
  if ("error" in fields) return NextResponse.json({ error: fields.error }, { status: 400 });
  const updated = await prisma.admission.update({ where: { id }, data: fields.data, include: ADMISSION_INCLUDE });
  return NextResponse.json(publicAdmission(updated));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireFrequenciaUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const admission = await prisma.admission.findUnique({
    where: { id },
    include: { documents: { include: { files: { select: { storedName: true } } } } },
  });
  if (!admission) return NextResponse.json({ error: "Onboarding não encontrado." }, { status: 404 });

  // Documentos e arquivos saem em cascata no banco; os arquivos em disco, aqui.
  await prisma.admission.delete({ where: { id } });
  await removeAttachmentFiles(
    admission.documents.flatMap((d) => d.files.map((f) => f.storedName)),
    "admissoes"
  );
  return NextResponse.json({ ok: true });
}
