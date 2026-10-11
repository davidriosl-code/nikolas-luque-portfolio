export const dynamic = "force-dynamic";

const headers = { "Content-Type": "application/json", "Cache-Control": "private, max-age=60" };
const username = "davidriosl-code";

export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind");
  if (kind !== "profile" && kind !== "repos") return Response.json({ error: "Consulta no válida." }, { status: 400, headers });
  const path = kind === "repos" ? `/users/${username}/repos?sort=updated&per_page=12&type=owner` : `/users/${username}`;
  try {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "NikolasLuque-Portfolio", "X-GitHub-Api-Version": "2026-03-10" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      const limited = response.status === 429 || (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0");
      return Response.json({ error: limited ? "GitHub alcanzó su límite de consultas públicas. Inténtalo más tarde o abre el perfil." : "GitHub no pudo completar la consulta. Puedes abrir el perfil directamente." }, { status: limited ? 429 : 502, headers });
    }
    const data = await response.json();
    if (kind === "repos") {
      if (!Array.isArray(data)) throw new Error("Invalid GitHub response");
      const repos = data.slice(0,12).map((item: Record<string, unknown>) => ({
        name: typeof item.name === "string" ? item.name : "Repositorio",
        description: typeof item.description === "string" ? item.description.slice(0,400) : "Sin descripción publicada.",
        language: typeof item.language === "string" ? item.language : "Sin lenguaje principal",
        href: `https://github.com/${username}/${encodeURIComponent(String(item.name ?? ""))}`,
      }));
      return Response.json({ kind, repos, checkedAt: new Date().toISOString() }, { headers });
    }
    if (!data || typeof data !== "object") throw new Error("Invalid profile");
    const profile = data as Record<string, unknown>;
    return Response.json({ kind, name: typeof profile.name === "string" ? profile.name : username, bio: typeof profile.bio === "string" ? profile.bio.slice(0,600) : "Sin biografía pública.", publicRepos: typeof profile.public_repos === "number" ? profile.public_repos : 0, href: `https://github.com/${username}`, checkedAt: new Date().toISOString() }, { headers });
  } catch {
    return Response.json({ error: "No se pudo conectar con GitHub. No he obtenido datos nuevos." }, { status: 502, headers });
  }
}
