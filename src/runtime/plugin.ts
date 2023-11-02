import { Ref, ref } from "vue";
import { defineNuxtPlugin } from "#app";
import { LocationQuery } from "vue-router";
import { UTMParams, AdditionalInfo, DataObject } from "nuxt-utm";

const LOCAL_STORAGE_KEY = "nuxt-utm-data";
const SESSION_ID_KEY = "nuxt-utm-session-id";

const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15);
};

const readLocalData = () => {
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);

  try {
    if (localData) {
      return JSON.parse(localData);
    }
  } catch (error) {
    console.error("Error parsing local storage data", error);
  }
  return [];
};

const getSessionID = () => {
  const sessionID = sessionStorage.getItem(SESSION_ID_KEY) || "";
  if (sessionID == "") {
    const newSessionID = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, newSessionID);
    return newSessionID;
  }
  return sessionID;
};

const urlHasUtmParams = (query: LocationQuery) => {
  return (
    query.utm_source ||
    query.utm_medium ||
    query.utm_campaign ||
    query.utm_term ||
    query.utm_content
  );
};

const getUtmParams = (query: LocationQuery) => {
  const utmParams: UTMParams = {
    utm_source: query.utm_source?.toString(),
    utm_medium: query.utm_medium?.toString(),
    utm_campaign: query.utm_campaign?.toString(),
    utm_term: query.utm_term?.toString(),
    utm_content: query.utm_content?.toString(),
  };
  return utmParams;
};

const generateAdditionalInfo = () => {
  const additionalInfo: AdditionalInfo = {
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    language: navigator.language,
    screen: {
      width: screen.width,
      height: screen.height,
    },
  };
  return additionalInfo;
};

const isRepeatedEntry = (data: Ref<DataObject[]>, currentSessionID: string) => {
  const lastEntry = data.value?.[0];
  return lastEntry && lastEntry.sessionId === currentSessionID;
};

export default defineNuxtPlugin((nuxtApp) => {
  const data = ref<DataObject[]>([]);

  nuxtApp.hook("app:mounted", () => {
    data.value = readLocalData();

    const sessionId = getSessionID();

    const query = nuxtApp._route.query;

    if (!urlHasUtmParams(query)) {
      return {
        provide: {
          utmData: data,
        },
      }; // Exit if no UTM parameters found
    }

    const utmParams = getUtmParams(query);

    const additionalInfo = generateAdditionalInfo();

    const timestamp = new Date().toISOString();

    const dataObject: DataObject = {
      timestamp,
      utmParams,
      additionalInfo,
      sessionId,
    };

    if (isRepeatedEntry(data, sessionId)) {
      // Exit if the last entry is the same as the new entry
      return {
        provide: {
          utmData: data,
        },
      };
    }

    data.value.unshift(dataObject);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.value));
  });

  return {
    provide: {
      utmData: data,
    },
  };
});
