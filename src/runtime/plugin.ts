import { ref } from "vue";
import { defineNuxtPlugin } from "#app";

const LOCAL_STORAGE_KEY = "nuxt-utm-data";
const SESSION_ID_KEY = "nuxt-utm-session-id";

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface AdditionalInfo {
  referrer: string;
  userAgent: string;
  language: string;
  screen: {
    width: number;
    height: number;
  };
}

interface DataObject {
  timestamp: string;
  utmParams: UTMParams;
  additionalInfo: AdditionalInfo;
  sessionId: string;
}

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15);
}

export default defineNuxtPlugin((nuxtApp) => {
  console.log("Plugin injected by my-module!");

  const data = ref<DataObject[]>([]);

  nuxtApp.hook("app:mounted", () => {
    console.log("_route:", nuxtApp._route);
    console.log("query:", nuxtApp._route.query);

    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);

    try {
      if (localData) {
        data.value = JSON.parse(localData);
      }
    } catch (error) {
      console.error("Error parsing local storage data", error);
    }

    let sessionId = sessionStorage.getItem(SESSION_ID_KEY) || "";
    if (sessionId == "") {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    const query = nuxtApp._route.query;

    if (
      !query.utm_source &&
      !query.utm_medium &&
      !query.utm_campaign &&
      !query.utm_term &&
      !query.utm_content
    ) {
      return {
        provide: {
          utmData: data,
        },
      }; // Exit if no UTM parameters found
    }

    const utmParams: UTMParams = {
      utm_source: query.utm_source?.toString(),
      utm_medium: query.utm_medium?.toString(),
      utm_campaign: query.utm_campaign?.toString(),
      utm_term: query.utm_term?.toString(),
      utm_content: query.utm_content?.toString(),
    };

    const additionalInfo: AdditionalInfo = {
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: {
        width: screen.width,
        height: screen.height,
      },
    };

    const timestamp = new Date().toISOString();

    const dataObject: DataObject = {
      timestamp,
      utmParams,
      additionalInfo,
      sessionId,
    };

    const lastEntry = data.value[0];
    if (
      lastEntry &&
      lastEntry.utmParams.utm_source === utmParams.utm_source &&
      lastEntry.utmParams.utm_medium === utmParams.utm_medium &&
      lastEntry.utmParams.utm_campaign === utmParams.utm_campaign &&
      lastEntry.utmParams.utm_term === utmParams.utm_term &&
      lastEntry.utmParams.utm_content === utmParams.utm_content &&
      lastEntry.sessionId === sessionId
    ) {
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
