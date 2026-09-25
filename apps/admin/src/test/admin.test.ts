import test from "node:test";
import assert from "node:assert/strict";
import { AdminPolicy, createAuditRecord } from "../index.js";

test("moderators can review content", () => {
  assert.doesNotThrow(() =>
    AdminPolicy.validateDecision("moderator", "review")
  );
});

test("blocking requires administrator authority", () => {
  assert.throws(
    () => AdminPolicy.validateDecision("moderator", "block"),
    /ADMIN_ROLE_REQUIRED_FOR_BLOCK/
  );
});

test("audit records require complete immutable event data", () => {
  const record = createAuditRecord(
    "admin-1",
    "moderation.resolve",
    "track",
    "track-1",
    "Rights review completed",
    "2026-01-01T00:00:00.000Z"
  );

  assert.deepEqual(record, {
    actorId: "admin-1",
    action: "moderation.resolve",
    targetType: "track",
    targetId: "track-1",
    reason: "Rights review completed",
    occurredAt: "2026-01-01T00:00:00.000Z"
  });
});
