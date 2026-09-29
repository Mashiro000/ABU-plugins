import assert from "node:assert/strict";
import test from "node:test";
import { versionCompareNewestFirst } from "./plugin-catalog.mjs";

test("versions are ordered newest to oldest using semantic version rules", () => {
  const versions = ["1.0.0", "1.10.0", "2.0.0-beta.1", "2.0.0", "1.2.0", "2.0.0-beta.2"];
  assert.deepEqual(
    versions.sort(versionCompareNewestFirst),
    ["2.0.0", "2.0.0-beta.2", "2.0.0-beta.1", "1.10.0", "1.2.0", "1.0.0"],
  );
});
