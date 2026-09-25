import test from "node:test";
import assert from "node:assert/strict";
import {
  ArtistStudioPolicy,
  createReleaseSubmission
} from "../index.js";

test("artist roles enforce release and royalty boundaries", () => {
  assert.equal(ArtistStudioPolicy.canManageRelease("editor"), true);
  assert.equal(ArtistStudioPolicy.canManageRoyalties("editor"), false);
  assert.equal(ArtistStudioPolicy.canManageRoyalties("royalty_manager"), true);
});

test("release submission validates catalog identity", () => {
  assert.throws(
    () => createReleaseSubmission({
      id: "",
      artistId: "artist-1",
      title: "Release",
      kind: "single",
      status: "draft",
      releaseDate: null,
      upc: null,
      artworkKey: null,
      trackIds: ["track-1"]
    }),
    /INVALID_RELEASE/
  );
});

test("valid release becomes a submission", () => {
  const result = createReleaseSubmission({
    id: "release-1",
    artistId: "artist-1",
    title: "Release",
    kind: "single",
    status: "draft",
    releaseDate: null,
    upc: null,
    artworkKey: null,
    trackIds: ["track-1"]
  }, "2026-01-01T00:00:00.000Z");

  assert.equal(result.status, "submitted");
  assert.equal(result.submittedAt, "2026-01-01T00:00:00.000Z");
});
