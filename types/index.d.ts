declare module "nuxt-utm" {
  interface UTMParams {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }

  interface GCLIDParams {
    gclid?: string;
    gad_source?: string;
  }

  interface AdditionalInfo {
    referrer: string;
    userAgent: string;
    language: string;
    landingPageUrl: string;
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
    gclidParams?: GCLIDParams;
  }
}
