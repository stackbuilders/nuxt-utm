import { DataObject } from "nuxt-utm";
import {
  readLocalData,
  getSessionID,
  urlHasUtmParams,
  getUtmParams,
  getAdditionalInfo,
  isRepeatedEntry,
} from "./utm";
import { ref } from "vue";
import { defineNuxtPlugin } from "#app";
import { HookResult } from "@unhead/schema";

const LOCAL_STORAGE_KEY = "nuxt-utm-data";
const SESSION_ID_KEY = "nuxt-utm-session-id";

export default defineNuxtPlugin((nuxtApp) => {
  const data = ref<DataObject[]>([]);

  nuxtApp.hook("app:mounted", (): HookResult => {
    data.value = readLocalData(LOCAL_STORAGE_KEY);

    const sessionId = getSessionID(SESSION_ID_KEY);

    const query = nuxtApp._route.query;

    // Exit if no UTM parameters found
    if (!urlHasUtmParams(query)) return;

    const utmParams = getUtmParams(query);

    const additionalInfo = getAdditionalInfo();

    const timestamp = new Date().toISOString();

    const dataObject: DataObject = {
      timestamp,
      utmParams,
      additionalInfo,
      sessionId,
    };

    // Exit if the last entry is the same as the new entry
    if (isRepeatedEntry(data, sessionId)) return;

    data.value.unshift(dataObject);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.value));
  });

  return {
    provide: {
      utmData: data,
    },
  };
});
