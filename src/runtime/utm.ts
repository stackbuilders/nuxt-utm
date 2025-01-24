import { Ref } from "vue";
import { LocationQuery } from "vue-router";
import { UTMParams, AdditionalInfo, DataObject, GCLIDParams } from "nuxt-utm";

export const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15);
};

export const readLocalData = (localStorageKey: string) => {
  const localData = localStorage.getItem(localStorageKey);

  try {
    if (localData) {
      return JSON.parse(localData) as DataObject[];
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

export const urlHasUtmParams = (query: LocationQuery): boolean => {
  return Boolean(
    query.utm_source ||
      query.utm_medium ||
      query.utm_campaign ||
      query.utm_term ||
      query.utm_content,
  );
};

export const getUtmParams = (query: LocationQuery): UTMParams => {
  return {
    utm_source: query.utm_source?.toString(),
    utm_medium: query.utm_medium?.toString(),
    utm_campaign: query.utm_campaign?.toString(),
    utm_term: query.utm_term?.toString(),
    utm_content: query.utm_content?.toString(),
  };
};

export const urlHasGCLID = (query: LocationQuery): boolean => {
  return Boolean(query.gclid || query.gad_source);
};

export const getGCLID = (query: LocationQuery): GCLIDParams => {
  return {
    gclid: query.gclid?.toString(),
    gad_source: query.gad_source?.toString(),
  };
};

export const getAdditionalInfo = (): AdditionalInfo => {
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
};

export const isRepeatedEntry = (
  data: Ref<DataObject[]>,
  currentEntry: DataObject,
): boolean => {
  const lastEntry = data.value?.[0];
  const lastUtm = lastEntry?.utmParams;
  const newUtm = currentEntry.utmParams;

  return (
    lastEntry &&
    lastUtm.utm_campaign === newUtm.utm_campaign &&
    lastUtm.utm_content === newUtm.utm_content &&
    lastUtm.utm_medium === newUtm.utm_medium &&
    lastUtm.utm_source === newUtm.utm_source &&
    lastUtm.utm_term === newUtm.utm_term &&
    lastEntry.sessionId === currentEntry.sessionId
  );
};
