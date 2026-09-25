export type ArtistRole =
  | "owner"
  | "manager"
  | "editor"
  | "analyst"
  | "royalty_manager";

export type ReleaseStatus =
  | "draft"
  | "validating"
  | "moderation"
  | "scheduled"
  | "published"
  | "rejected";

export type VerificationStatus =
  | "not_submitted"
  | "pending"
  | "verified"
  | "rejected";

export interface ArtistProfile {
  artistId: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  headerUrl: string | null;
  countryCode: string | null;
  genres: string[];
  links: Record<string, string>;
}

export interface ArtistTeamMember {
  artistId: string;
  userId: string;
  role: ArtistRole;
}

export interface ArtistRelease {
  id: string;
  artistId: string;
  title: string;
  kind: "single" | "ep" | "album";
  status: ReleaseStatus;
  releaseDate: string | null;
  upc: string | null;
  artworkKey: string | null;
  trackIds: string[];
}

export interface ReleaseSubmission {
  releaseId: string;
  artistId: string;
  status: "submitted" | "reviewing" | "approved" | "rejected";
  submittedAt: string;
}

export interface ArtistVerification {
  artistId: string;
  status: VerificationStatus;
  evidenceReferences: string[];
}

export interface ArtistPost {
  artistId: string;
  title: string | null;
  body: string;
  mediaReferences: string[];
  publish: boolean;
}

export class ArtistStudioPolicy {
  static canManageRelease(role: ArtistRole): boolean {
    return ["owner", "manager", "editor"].includes(role);
  }

  static canManageRoyalties(role: ArtistRole): boolean {
    return ["owner", "manager", "royalty_manager"].includes(role);
  }

  static validateRelease(input: ArtistRelease): string[] {
    const errors: string[] = [];
    if (!input.id) errors.push("release.id");
    if (!input.artistId) errors.push("release.artistId");
    if (!input.title.trim()) errors.push("release.title");
    if (input.trackIds.length === 0) errors.push("release.trackIds");
    return errors;
  }

  static validateVerification(input: ArtistVerification): string[] {
    const errors: string[] = [];
    if (!input.artistId) errors.push("verification.artistId");
    if (input.status === "pending" && input.evidenceReferences.length === 0) {
      errors.push("verification.evidenceReferences");
    }
    return errors;
  }
}

export function createReleaseSubmission(
  release: ArtistRelease,
  now = new Date().toISOString()
): ReleaseSubmission {
  const errors = ArtistStudioPolicy.validateRelease(release);
  if (errors.length) {
    throw new Error(`INVALID_RELEASE:${errors.join(",")}`);
  }

  return {
    releaseId: release.id,
    artistId: release.artistId,
    status: "submitted",
    submittedAt: now
  };
}
