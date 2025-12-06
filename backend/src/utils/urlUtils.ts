import { Request } from "express";
import { env } from "../config/env";

/**
 * Convert a relative URL to an absolute URL
 * Uses the request host or falls back to BASE_URL from env
 */
export const toAbsoluteUrl = (relativeUrl: string, req?: Request): string => {
  if (!relativeUrl) return relativeUrl;
  
  // If already absolute, return as is
  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }
  
  // Get base URL from request or env
  let baseUrl: string;
  if (req) {
    const protocol = req.protocol;
    const host = req.get("host");
    baseUrl = `${protocol}://${host}`;
  } else {
    baseUrl = env.baseUrl;
  }
  
  // Ensure relative URL starts with /
  const url = relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`;
  
  return `${baseUrl}${url}`;
};

/**
 * Convert image URLs in an incident object to absolute URLs
 */
export const convertIncidentUrls = (incident: any, req?: Request): any => {
  if (!incident) return incident;
  
  const converted = { ...incident };
  
  if (converted.imageBeforeUrl) {
    converted.imageBeforeUrl = toAbsoluteUrl(converted.imageBeforeUrl, req);
  }
  
  if (converted.imageAfterUrl) {
    converted.imageAfterUrl = toAbsoluteUrl(converted.imageAfterUrl, req);
  }
  
  return converted;
};

