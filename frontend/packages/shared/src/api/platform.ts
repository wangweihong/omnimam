import { apiClient } from "./client";
import type {
  AssetListResponse,
  AssetChunkUploadCancelResponse,
  AssetChunkUploadInitResponse,
  AssetChunkUploadPartResponse,
  AssetSearchParseResponse,
  AssetUploadResponse,
  CanvasConnection,
  CanvasCreateResponse,
  CanvasDetail,
  CanvasExportPayload,
  CanvasExportResponse,
  CanvasGetResponse,
  CanvasListResponse,
  CanvasImportResponse,
  CanvasNode,
  CanvasViewport,
  CanvasWorkflowExportResponse,
  CanvasWorkflowImportResponse,
  CanvasWorkflowPackageExportResponse,
  CanvasWorkflowPackageImportResponse,
  CanvasWorkflowPayload,
  CanvasRunResponse,
  CanvasAssetRegisterOutputResponse,
  MeResponse,
  ProviderListResponse,
  ProviderModelListResponse,
  ProviderModelSyncResponse,
  ProviderTestResponse,
  SystemLLMConfig,
  SystemLLMConfigListResponse,
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

export function updateProvider(providerID: string, input: Record<string, unknown>) {
  return apiClient.patch(`/providers/${providerID}`, input);
}

export function testProvider(providerID: string, input: Record<string, unknown>) {
  return apiClient.post<ProviderTestResponse>(`/providers/${providerID}/test`, input);
}

export function listProviderModels(providerID: string) {
  return apiClient.get<ProviderModelListResponse>(`/providers/${providerID}/models`);
}

export function createProviderModel(providerID: string, input: Record<string, unknown>) {
  return apiClient.post(`/providers/${providerID}/models`, input);
}

export function updateProviderModel(providerID: string, modelID: string, input: Record<string, unknown>) {
  return apiClient.patch(`/providers/${providerID}/models/${modelID}`, input);
}

export function syncProviderModels(providerID: string) {
  return apiClient.post<ProviderModelSyncResponse>(`/providers/${providerID}/models/sync`);
}

export function getSystemLLMConfig() {
  return apiClient.get<SystemLLMConfigListResponse>("/system-llm-config");
}

export function putSystemLLMConfig(configs: SystemLLMConfig[]) {
  return apiClient.put<SystemLLMConfigListResponse>("/system-llm-config", { configs });
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

export function initAssetChunkUpload(input: {
  filename: string;
  size: number;
  checksum: string;
  chunk_size: number;
  total_chunks: number;
  tag_names?: string[];
  source_type?: string;
}) {
  return apiClient.post<AssetChunkUploadInitResponse>("/assets/uploads/chunks/init", input);
}

export function uploadAssetChunk(checksum: string, index: number, chunk: Blob) {
  return apiClient.put<AssetChunkUploadPartResponse>(`/assets/uploads/chunks/${checksum}/${index}`, chunk, {
    headers: { "Content-Type": "application/octet-stream" }
  });
}

export function completeAssetChunkUpload(input: {
  filename: string;
  size: number;
  checksum: string;
  chunk_size: number;
  total_chunks: number;
  tag_names?: string[];
  source_type?: string;
}) {
  return apiClient.post<AssetUploadResponse>(`/assets/uploads/chunks/${input.checksum}/complete`, input);
}

export function cancelAssetChunkUpload(checksum: string) {
  return apiClient.delete<AssetChunkUploadCancelResponse>(`/assets/uploads/chunks/${checksum}`);
}

export function assetThumbnailURL(assetID: string) {
  return `/api/v1/assets/${assetID}/thumbnail`;
}

export function assetContentURL(assetID: string) {
  return `/api/v1/assets/${assetID}/content`;
}

export function renameAsset(assetID: string, name: string) {
  return apiClient.patch(`/assets/${assetID}`, { name });
}

export function deleteAsset(assetID: string) {
  return apiClient.delete(`/assets/${assetID}`);
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

export function createCanvas(input: {
  title?: string;
  icon?: string;
  kind?: string;
  project?: string;
  board_x?: number;
  board_y?: number;
}) {
  return apiClient.post<CanvasCreateResponse>("/canvases", input);
}

export function getCanvas(canvasID: string) {
  return apiClient.get<CanvasGetResponse>(`/canvases/${canvasID}`);
}

export function saveCanvas(
  canvasID: string,
  input: {
    title: string;
    icon?: string;
    kind?: string;
    nodes: CanvasNode[];
    connections: CanvasConnection[];
    viewport: CanvasViewport;
    logs?: unknown[];
    settings?: Record<string, unknown>;
    base_updated_at?: number;
  }
) {
  return apiClient.put<CanvasDetail>(`/canvases/${canvasID}`, input);
}

export function updateCanvasMeta(canvasID: string, input: Record<string, unknown>) {
  return apiClient.patch(`/canvases/${canvasID}`, input);
}

export function deleteCanvas(canvasID: string) {
  return apiClient.delete(`/canvases/${canvasID}`);
}

export function runCanvas(canvasID: string) {
  return apiClient.post<CanvasRunResponse>(`/canvases/${canvasID}/run`);
}

export function exportCanvas(canvasID: string) {
  return apiClient.get<CanvasExportResponse>(`/canvases/${canvasID}/export`);
}

export function importCanvas(canvas: CanvasExportPayload, project?: string) {
  return apiClient.post<CanvasImportResponse>("/canvases/import", { canvas, project });
}

export function exportCanvasWorkflow(canvasID: string, input: Partial<CanvasWorkflowPayload> = {}) {
  return apiClient.post<CanvasWorkflowExportResponse>(`/canvases/${canvasID}/workflows/export`, input);
}

export function importCanvasWorkflow(canvasID: string, workflow: CanvasWorkflowPayload) {
  return apiClient.post<CanvasWorkflowImportResponse>(`/canvases/${canvasID}/workflows/import`, { workflow });
}

export function exportCanvasWorkflowPackage(canvasID: string, input: Partial<CanvasWorkflowPayload> & { asset_ids?: string[]; filename?: string } = {}) {
  return apiClient.post<CanvasWorkflowPackageExportResponse>(`/canvases/${canvasID}/workflows/export-package`, input);
}

export function importCanvasWorkflowPackage(canvasID: string, workflowPackage: Record<string, unknown>) {
  return apiClient.post<CanvasWorkflowPackageImportResponse>(`/canvases/${canvasID}/workflows/import-package`, { package: workflowPackage });
}

export function runCanvasNode(canvasID: string, nodeID: string, input: Record<string, unknown>) {
  return apiClient.post<CanvasRunResponse>(`/canvases/${canvasID}/nodes/${nodeID}/run`, input);
}

export function registerCanvasOutput(input: { canvas_id: string; node_id: string; asset_id: string; metadata?: Record<string, unknown> }) {
  return apiClient.post<CanvasAssetRegisterOutputResponse>("/canvas-assets/register-output", input);
}

export function canvasAssetDownloadURL() {
  return "/api/v1/canvas-assets/download";
}
