import { ref, Ref } from "vue";
import { DataObject } from "nuxt-utm";
import {
  isRepeatedEntry,
  readLocalData,
  urlHasUtmParams,
  getUtmParams,
} from "./../src/runtime/utm";
import { describe, it, expect, beforeEach } from "vitest";

global.localStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    key: (index: number): string | null => "",
    length: Object.keys(store).length,
  };
})();

describe("readLocalData function", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("Returns empty array if local storage is empty", () => {
    expect(readLocalData("nuxt-utm-test")).toEqual([]);
  });

  it("Returns an array with objects if local storage has data", () => {
    localStorage.setItem("nuxt-utm-test", utmItem);
    expect(readLocalData("nuxt-utm-test")).toEqual(JSON.parse(utmItem));
  });
});

describe("urlHasUtmParams function", () => {
  it("Returns false if there are no utm values", () => {
    const locationQueryMock = {};
    expect(urlHasUtmParams(locationQueryMock)).toBeFalsy();
  });

  it("Returns true if at least one utm value exists", () => {
    const locationQueryMock = { utm_source: "test_source" };
    expect(urlHasUtmParams(locationQueryMock)).toBeTruthy();
  });
});

describe("getUtmParams function", () => {
  it("Returns the correct utm values", () => {
    const locationQueryMock = {
      utm_source: "test_source",
      utm_medium: "test_medium",
      utm_term: "test_term",
      utm_content: "test_content",
    };
    expect(getUtmParams(locationQueryMock)).toEqual({
      utm_source: "test_source",
      utm_medium: "test_medium",
      utm_term: "test_term",
      utm_content: "test_content",
    });
  });
});

describe("isRepeatedEntry function", () => {
  let data: Ref<DataObject[]>;
  beforeEach(() => {
    data = ref<DataObject[]>(JSON.parse(`[${utmItem}]`));
  });

  it("Returns true if the utm params and the session already exists in local storage", () => {
    expect(isRepeatedEntry(data, "beai1gx7dg")).toBeTruthy();
  });
  it("Returns false if the utm params are the same but the session is different", () => {
    expect(isRepeatedEntry(data, "newSession")).toBeFalsy();
  });
  it("Returns false if the utm params are different but the session is the same", () => {
    const data = ref<DataObject[]>(JSON.parse(`[${utmItem}]`));
    expect(isRepeatedEntry(data, "newSession")).toBeFalsy();
  });
});

const utmItem = `{
  "timestamp": "2023-11-02T10:11:17.219Z",
  "utmParams": {
    "utm_source": "test_source",
    "utm_medium": "test_medium",
    "utm_campaign": "test_campaign",
    "utm_term": "test_term",
    "utm_content": "test_content"
  },
  "additionalInfo": {
    "referrer": "http://localhost:3000/?utm_source=test_source&utm_medium=test_medium&utm_campaign=test_campaign&utm_term=test_term&utm_content=test_content",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "language": "en-GB",
    "screen": {
      "width": 1728,
      "height": 1117
    }
  },
  "sessionId": "beai1gx7dg"
}`;
