export type AdminRole =
  | "admin"
  | "moderator"
  | "rights_operator"
  | "trust_operator"
  | "catalog_operator"
  | "support_operator";

export type ModerationDecision = "review" | "approve" | "reject" | "block";

export interface ModerationCase {
  id: string;
  targetType: "track" | "artist" | "album" | "playlist" | "user" | "post";
  targetId: string;
  reason: string;
  status: "open" | "reviewing" | "resolved" | "rejected";
}

export interface AuditRecord {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  occurredAt: string;
}

export interface TrustDecision {
  targetId: string;
  decision: "allow" | "review" | "block";
  signals: string[];
}

export class AdminPolicy {
  static canModerate(role: AdminRole): boolean {
    return ["admin", "moderator"].includes(role);
  }

  static canOperateRights(role: AdminRole): boolean {
    return ["admin", "rights_operator"].includes(role);
  }

  static canOperateTrust(role: AdminRole): boolean {
    return ["admin", "trust_operator"].includes(role);
  }

  static canOperateCatalog(role: AdminRole): boolean {
    return ["admin", "catalog_operator"].includes(role);
  }

  static validateDecision(
    role: AdminRole,
    decision: ModerationDecision
  ): void {
    if (!AdminPolicy.canModerate(role)) {
      throw new Error("ADMIN_MODERATION_REQUIRED");
    }
    if (decision === "block" && role !== "admin") {
      throw new Error("ADMIN_ROLE_REQUIRED_FOR_BLOCK");
    }
  }
}

export function createAuditRecord(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  reason: string,
  occurredAt = new Date().toISOString()
): AuditRecord {
  if (!actorId || !action || !targetType || !targetId || !reason) {
    throw new Error("INVALID_AUDIT_RECORD");
  }

  return {
    actorId,
    action,
    targetType,
    targetId,
    reason,
    occurredAt
  };
}
