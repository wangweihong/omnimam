import { apiClient } from "./client";
import type {
  AssetListResponse,
  AssetSearchParseResponse,
  AssetUploadResponse,
  CanvasListResponse,
  MeResponse,
  ProviderListResponse,
  ProviderModelListResponse,
  TaskListResponse
} from "./types";

export function getMe() {
  return apiClient.get<MeResponse>("/me");
}

export function listProviders() {
  return apiClient.get<ProviderListResponse>("/providers");
}

export function createProvider(input: Record<string, unknown>) {
  return apiClient.post("/providers", input);
}

export function listProviderModels(providerID: string) {
  return apiClient.get<ProviderModelListResponse>(`/providers/${providerID}/models`);
}

export function createProviderModel(providerID: string, input: Record<string, unknown>) {
  return apiClient.post(`/providers/${providerID}/models`, input);
}

export function listAssets(query: Record<string, string | number | boolean | undefined> = {}) {
  return apiClient.get<AssetListResponse>("/assets", { query });
}

export function parseAssetSearch(text: string) {
  return apiClient.post<AssetSearchParseResponse>("/assets/search/parse", { text });
}

export function uploadAsset(file: File, tags: string, sourceType = "user_upload") {
  const form = new FormData();
  form.set("file", file);
  form.set("tags", tags);
  form.set("source_type", sourceType);
  return apiClient.post<AssetUploadResponse>("/assets/upload", form);
}

export function assetThumbnailURL(assetID: string) {
  return `/api/v1/assets/${assetID}/thumbnail`;
}

export function listTasks(query: Record<string, string | number | boolean | undefined> = {}) {
  return apiClient.get<TaskListResponse>("/tasks", { query });
}

export function cancelTask(taskID: string) {
  return apiClient.post(`/tasks/${taskID}/cancel`);
}

export function listCanvases() {
  return apiClient.get<CanvasListResponse>("/canvases");
}
