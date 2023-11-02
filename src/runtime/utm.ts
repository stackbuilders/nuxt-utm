import { Ref } from "vue";
import { LocationQuery } from "vue-router";
import { UTMParams, AdditionalInfo, DataObject } from "nuxt-utm";

const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15);
};

export const readLocalData = (localStorageKey: string) => {
  const localData = localStorage.getItem(localStorageKey);

  try {
    if (localData) {
      return JSON.parse(localData);
    }
  } catch (error) {
    console.error("Error parsing local storage data", error);
  }
  return [];
};

export const getSessionID = (sessionIdKey: string) => {
  const sessionID = sessionStorage.getItem(sessionIdKey) || "";
  if (sessionID == "") {
    const newSessionID = generateSessionId();
    sessionStorage.setItem(sessionIdKey, newSessionID);
    return newSessionID;
  }
  return sessionID;
};

export const urlHasUtmParams = (query: LocationQuery) => {
  return (
    query.utm_source ||
    query.utm_medium ||
    query.utm_campaign ||
    query.utm_term ||
    query.utm_content
  );
};

export const getUtmParams = (query: LocationQuery) => {
  const utmParams: UTMParams = {
    utm_source: query.utm_source?.toString(),
    utm_medium: query.utm_medium?.toString(),
    utm_campaign: query.utm_campaign?.toString(),
    utm_term: query.utm_term?.toString(),
    utm_content: query.utm_content?.toString(),
  };
  return utmParams;
};

export const generateAdditionalInfo = () => {
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

export const isRepeatedEntry = (
  data: Ref<DataObject[]>,
  currentSessionID: string
) => {
  const lastEntry = data.value?.[0];
  return lastEntry && lastEntry.sessionId === currentSessionID;
};
