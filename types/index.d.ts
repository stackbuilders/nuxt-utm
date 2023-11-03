declare module "nuxt-utm" {
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
}
