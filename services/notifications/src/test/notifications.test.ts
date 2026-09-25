import test from "node:test";
import assert from "node:assert/strict";
import { planDelivery } from "../index.js";

const event = {
  id: "event-1",
  userId: "user-1",
  kind: "new_release" as const,
  title: "New release",
  body: "An artist you follow released music.",
  data: {},
  createdAt: "2026-01-01T00:00:00.000Z"
};

test("notification planning respects release preferences", () => {
  const intents = planDelivery(event, {
    userId: "user-1",
    email: false,
    push: false,
    newReleases: true,
    recommendations: true
  });

  assert.deepEqual(intents.map(x => x.channel), ["in_app"]);
});

test("enabled preferences produce multi-channel delivery intents", () => {
  const intents = planDelivery(event, {
    userId: "user-1",
    email: true,
    push: true,
    newReleases: true,
    recommendations: true
  });

  assert.deepEqual(
    intents.map(x => x.channel),
    ["in_app", "push", "email"]
  );
});
