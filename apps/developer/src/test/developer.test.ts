import test from "node:test";
import assert from "node:assert/strict";
import {
  endpointRequires,
  validateApplication
} from "../index.js";

test("developer application validates HTTPS webhooks", () => {
  const errors = validateApplication({
    id: "app-1",
    ownerId: "user-1",
    name: "Example",
    scopes: ["catalog.read"],
    redirectUris: [],
    webhookUrl: "http://example.com/webhook"
  });

  assert.ok(errors.includes("webhookUrl.https_required"));
});

test("duplicate scopes are rejected", () => {
  const errors = validateApplication({
    id: "app-1",
    ownerId: "user-1",
    name: "Example",
    scopes: ["catalog.read", "catalog.read"],
    redirectUris: [],
    webhookUrl: null
  });

  assert.ok(errors.includes("scopes.duplicate"));
});

test("API contracts expose explicit authorization scopes", () => {
  assert.equal(
    endpointRequires("/v1/catalog/search", "search.read"),
    true
  );
  assert.equal(
    endpointRequires("/v1/catalog/search", "artist.write"),
    false
  );
});
