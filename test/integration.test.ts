import { DataObject } from "nuxt-utm";
import { describe, it, expect, beforeEach } from "vitest";
import { fileURLToPath } from "node:url";
import { setup, $fetch, createPage } from "@nuxt/test-utils";
import { Page } from "playwright-core";

describe("ssr", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
    browser: true,
  });

  let entries: DataObject[];
  let page: Page;

  beforeEach(async () => {
    page = await createPage(
      "/?utm_source=test_source&utm_medium=test_medium&utm_campaign=test_campaign&utm_term=test_term&utm_content=test_content"
    );
    const rawData = await page.evaluate(() =>
      window.localStorage.getItem("nuxt-utm-data")
    );
    entries = await JSON.parse(rawData ?? "[]");
  });

  describe("Module Playground", () => {
    it("Renders the index page", async () => {
      const html = await $fetch("/");
      expect(html).toContain("<h1>UTM Tracker</h1>");
    });
  });

  describe("Additional info", () => {
    it("Stores data in local storage", () => {
      expect(entries?.[0]).toBeDefined();
    });

    it("Stores Additional info", () => {
      expect(entries?.[0].additionalInfo).toBeDefined();
    });

    it("Stores the correct values", async () => {
      const info = await page.evaluate(() => {
        return {
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          language: navigator.language,
          landingPageUrl: window.location.href,
          screen: {
            width: screen.width,
            height: screen.height,
          },
        };
      });
      expect(entries?.[0].additionalInfo).toEqual(info);
    });
  });

  describe("UTM params", () => {
    it("Stores UTM params", () => {
      expect(entries?.[0].utmParams).toEqual({
        utm_campaign: "test_campaign",
        utm_content: "test_content",
        utm_medium: "test_medium",
        utm_source: "test_source",
        utm_term: "test_term",
      });
    });

    it("Doesn't store anything after a page reload with the same UTM params and session", async () => {
      await page.reload();
      const rawData = await page?.evaluate(() =>
        window.localStorage.getItem("nuxt-utm-data")
      );
      entries = await JSON.parse(rawData ?? "[]");
      expect(entries.length).toEqual(1);
    });

    it("Stores a new value if the UTM params are different but the session is the same", async () => {
      const urlBase = page.url().split("?")[0];
      await page.goto(
        `${urlBase}/?utm_source=test_source2&utm_medium=test_medium2&utm_campaign=test_campaign2&utm_term=test_term2&utm_content=test_content2`
      );
      const rawData = await page.evaluate(() =>
        localStorage.getItem("nuxt-utm-data")
      );
      entries = await JSON.parse(rawData ?? "[]");
      expect(entries[0].utmParams).toEqual({
        utm_campaign: "test_campaign2",
        utm_content: "test_content2",
        utm_medium: "test_medium2",
        utm_source: "test_source2",
        utm_term: "test_term2",
      });
    });

    it("Stores a new value if the UTM params are the same but the session is different", async () => {
      await page.evaluate(() =>
        sessionStorage.setItem("nuxt-utm-session-id", "old-session")
      );
      await page.reload();
      const rawData = await page.evaluate(() =>
        localStorage.getItem("nuxt-utm-data")
      );
      entries = await JSON.parse(rawData ?? "[]");
      expect(entries[0].utmParams).toEqual({
        utm_campaign: "test_campaign",
        utm_content: "test_content",
        utm_medium: "test_medium",
        utm_source: "test_source",
        utm_term: "test_term",
      });
    });
  });
});

describe("Module configuration", () => {
  describe("when enabled", async () => {
    await setup({
      rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
      browser: true,
    });

    it("should track UTM parameters", async () => {
      const page = await createPage(
        "/?utm_source=test_source&utm_medium=test_medium"
      );
      const rawData = await page.evaluate(() =>
        window.localStorage.getItem("nuxt-utm-data")
      );
      const entries = JSON.parse(rawData ?? "[]");
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  describe("when disabled", async () => {
    await setup({
      rootDir: fileURLToPath(new URL("./fixtures/disabled", import.meta.url)),
      browser: true,
    });

    it("should not track UTM parameters", async () => {
      const page = await createPage(
        "/?utm_source=test_source&utm_medium=test_medium"
      );
      const rawData = await page.evaluate(() =>
        window.localStorage.getItem("nuxt-utm-data")
      );
      expect(rawData).toBeNull();
    });
  });
});
