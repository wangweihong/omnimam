import type { CoreErrorResponse } from "./types";

export class ApiError extends Error {
  code: number;
  detail?: string;
  messages?: Record<string, string>;
  causes?: unknown[];
  status: number;

  constructor(status: number, body: CoreErrorResponse) {
    super(body.detail || body.message || `HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.detail = body.detail;
    this.messages = body.messages;
    this.causes = body.causes;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiClient {
  constructor(private readonly baseURL = "/api/v1") {}

  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  async post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  async patch<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  async put<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildURL(path, options.query);
    const headers = new Headers(options.headers);
    const { body, query, ...requestOptions } = options;
    void query;
    const init: RequestInit = { ...requestOptions, headers };

    if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
      init.body = body;
    } else if (body !== undefined) {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);
    if (!response.ok) {
      const body = await response.json().catch(() => ({
        code: response.status,
        message: response.statusText,
        detail: response.statusText
      }));
      throw new ApiError(response.status, body as CoreErrorResponse);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }

  private buildURL(path: string, query?: RequestOptions["query"]): string {
    const url = new URL(`${this.baseURL}${path}`, window.location.origin);
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    return url.pathname + url.search;
  }
}

export const apiClient = new ApiClient();
