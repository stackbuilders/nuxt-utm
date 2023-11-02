import { describe, it, expect, beforeEach } from "vitest";
import { fileURLToPath } from "node:url";
import { setup, $fetch, createPage } from "@nuxt/test-utils";
import { Page } from "playwright-core";

describe("ssr", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
    browser: true,
  });

  describe("Module Playground", () => {
    it("Renders the index page", async () => {
      const html = await $fetch("/");
      expect(html).toContain("<h1>UTM Tracker</h1>");
    });
  });

  describe("UTM params", () => {
    let utmParamsArray: any[];
    let page: Page;
    beforeEach(async () => {
      page = await createPage(
        "/?utm_source=test_source&utm_medium=test_medium&utm_campaign=test_campaign&utm_term=test_term&utm_content=test_content"
      );
      const rawData = await page.evaluate(() =>
        window.localStorage.getItem("nuxt-utm-data")
      );
      utmParamsArray = await JSON.parse(rawData ?? "[]");
    });

    it("Stores  data in local storage", async () => {
      expect(utmParamsArray?.[0]).toBeDefined();
    });
    it("Stores UTM params", async () => {
      expect(utmParamsArray?.[0].utmParams).toEqual({
        utm_campaign: "test_campaign",
        utm_content: "test_content",
        utm_medium: "test_medium",
        utm_source: "test_source",
        utm_term: "test_term",
      });
    });
    it("Stores new UTM params in the same session if they are different. ", async () => {
      await page.goto(
        "/?utm_source=test_source2&utm_medium=test_medium2&utm_campaign=test_campaign2&utm_term=test_term2&utm_content=test_content2"
      );
    });
  });
});
