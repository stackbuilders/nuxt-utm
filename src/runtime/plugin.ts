import type { DataObject } from "nuxt-utm";
import {
  readLocalData,
  getSessionID,
  getUtmParams,
  getAdditionalInfo,
  isRepeatedEntry,
  urlHasGCLID,
  getGCLID,
} from "./utm";
import { ref } from "vue";
import { defineNuxtPlugin } from "#app";
// import { type HookResult } from "@unhead/schema";

const LOCAL_STORAGE_KEY = "nuxt-utm-data";
const SESSION_ID_KEY = "nuxt-utm-session-id";

export default defineNuxtPlugin((nuxtApp) => {
  const data = ref<DataObject[]>([]);

  nuxtApp.hook("app:mounted", (): any => {
    data.value = readLocalData(LOCAL_STORAGE_KEY);

    const sessionId = getSessionID(SESSION_ID_KEY);

    const query = nuxtApp._route.query;
    const utmParams = getUtmParams(query);
    const additionalInfo = getAdditionalInfo();
    const timestamp = new Date().toISOString();

    const dataObject: DataObject = {
      timestamp,
      utmParams,
      additionalInfo,
      sessionId,
    };

    if (urlHasGCLID(query)) {
      dataObject.gclidParams = getGCLID(query);
    }

    // Exit if the last entry is the same as the new entry
    if (isRepeatedEntry(data, dataObject)) return;

    // Add the new item to the data array
    data.value.unshift(dataObject);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.value));
  });

  return {
    provide: {
      utm: data,
    },
  };
});
