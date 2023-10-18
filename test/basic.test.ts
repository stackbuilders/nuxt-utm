import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { setup, $fetch } from "@nuxt/test-utils";

describe("ssr", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
  });

  it("renders the index page", async () => {
    const html = await $fetch("/");
    expect(html).toContain("<h1>UTM Tracker</h1>");
  });

  // it("stores UTM data in local storage", async () => {
  //   await $fetch("/?utm_source=test&utm_medium=test_medium");
  //   expect(localStorage.getItem("nuxt-utm-data")).toBe("bla");
  // });
});
