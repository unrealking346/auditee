export type ApiScope =
  | "catalog.read"
  | "search.read"
  | "playback.authorize"
  | "library.read"
  | "analytics.read"
  | "artist.read"
  | "artist.write"
  | "webhooks";

export interface DeveloperApplication {
  id: string;
  ownerId: string;
  name: string;
  scopes: ApiScope[];
  redirectUris: string[];
  webhookUrl: string | null;
}

export interface ApiCredential {
  applicationId: string;
  keyId: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

export interface ApiEndpointContract {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  scope: ApiScope;
  description: string;
}

export const API_CONTRACTS: readonly ApiEndpointContract[] = [
  {
    method: "GET",
    path: "/v1/catalog/search",
    scope: "search.read",
    description: "Search the Waeve catalog."
  },
  {
    method: "GET",
    path: "/v1/catalog/home",
    scope: "catalog.read",
    description: "Retrieve catalog discovery surfaces."
  },
  {
    method: "GET",
    path: "/v1/artists/:artistId",
    scope: "artist.read",
    description: "Retrieve artist information."
  },
  {
    method: "POST",
    path: "/v1/playback/authorize",
    scope: "playback.authorize",
    description: "Request rights-aware playback authorization."
  }
];

export function validateApplication(
  application: DeveloperApplication
): string[] {
  const errors: string[] = [];

  if (!application.id) errors.push("id");
  if (!application.ownerId) errors.push("ownerId");
  if (!application.name.trim()) errors.push("name");

  const uniqueScopes = new Set(application.scopes);
  if (uniqueScopes.size !== application.scopes.length) {
    errors.push("scopes.duplicate");
  }

  if (application.webhookUrl !== null) {
    try {
      const url = new URL(application.webhookUrl);
      if (url.protocol !== "https:") errors.push("webhookUrl.https_required");
    } catch {
      errors.push("webhookUrl.invalid");
    }
  }

  return errors;
}

export function endpointRequires(
  path: string,
  scope: ApiScope
): boolean {
  return API_CONTRACTS.some(
    endpoint => endpoint.path === path && endpoint.scope === scope
  );
}
