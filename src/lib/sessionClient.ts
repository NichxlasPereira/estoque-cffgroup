/**
 * No navegador: se a API respondeu 401 (sessão do módulo expirou), volta para
 * a tela de senha do módulo. Retorna true quando redirecionou.
 */
export function redirectIfSessionExpired(res: Response, loginPath: string, returnTo: string): boolean {
  if (res.status !== 401) return false;
  window.location.replace(`${loginPath}?voltar=${encodeURIComponent(returnTo)}`);
  return true;
}

export async function logoutModule(module: "estoque"): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module }),
  }).catch(() => undefined);
}
