/**
 * No navegador: se a API respondeu 401 (sessão do módulo expirou), volta para
 * a tela de senha do módulo. Retorna true quando redirecionou.
 */
export function redirectIfSessionExpired(res: Response, loginPath: string, returnTo: string): boolean {
  if (res.status !== 401) return false;
  window.location.replace(`${loginPath}?voltar=${encodeURIComponent(returnTo)}`);
  return true;
}

/**
 * Um acesso não mantém o outro: cada módulo, ao abrir de verdade, encerra a
 * sessão do outro. Fica na página (e não no proxy) porque o proxy não
 * consegue distinguir uma visita de um pré-carregamento de link.
 */
export function endOtherModuleSession(current: "estoque" | "frequencia"): void {
  const request =
    current === "estoque"
      ? fetch("/api/frequencia/logout", { method: "POST" })
      : fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ module: "estoque" }),
        });
  request.catch(() => undefined);
}

export async function logoutModule(module: "estoque"): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module }),
  }).catch(() => undefined);
}
