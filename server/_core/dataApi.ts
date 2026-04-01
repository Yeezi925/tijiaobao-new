/**
 * Quick example (matches curl usage):
 *   await callDataApi("Youtube/search", {
 *     query: { gl: "US", hl: "en", q: "manus" },
 *   })
 */
import { ENV } from "./env";

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  options: DataApiCallOptions = {}
): Promise<unknown> {
  try {
    if (!ENV.forgeApiUrl) {
      console.warn("[Data API] BUILT_IN_FORGE_API_URL is not configured");
      return {};
    }
    if (!ENV.forgeApiKey) {
      console.warn("[Data API] BUILT_IN_FORGE_API_KEY is not configured");
      return {};
    }

    // Build the full URL by appending the service path to the base URL
    const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
    const fullUrl = new URL("webdevtoken.v1.WebDevService/CallApi", baseUrl).toString();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "connect-protocol-version": "1",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        apiId,
        query: options.query,
        body: options.body,
        path_params: options.pathParams,
        multipart_form_data: options.formData,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[Data API] Request failed (${response.status}): ${detail}`);
      // Return empty object to allow graceful degradation
      return {};
    }

    const payload = await response.json().catch(() => ({}));
    if (payload && typeof payload === "object" && "jsonData" in payload) {
      try {
        return JSON.parse((payload as Record<string, string>).jsonData ?? "{}");
      } catch {
        return (payload as Record<string, unknown>).jsonData;
      }
    }
    return payload;
  } catch (error) {
    console.error("[Data API] Error:", error instanceof Error ? error.message : error);
    // Return empty object to allow graceful degradation
    return {};
  }
}
