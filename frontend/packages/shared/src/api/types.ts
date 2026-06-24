export type FeatureFlags = Record<string, boolean>;

export interface CoreErrorResponse {
  data?: unknown;
  code: number;
  message: string;
  messages?: Record<string, string>;
  detail?: string;
  causes?: unknown[];
}

export interface MeResponse {
  user: { id: string; name: string };
  roles: string[];
  permissions: string[];
  feature_flags: FeatureFlags;
}

export interface ListRet {
  total?: number;
  page?: number;
  page_size?: number;
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  base_url?: string;
  auth_type?: string;
  credential_ref?: string;
}

export interface ProviderModel {
  id: string;
  name: string;
  provider_id: string;
  model: string;
  capabilities?: string[];
  enabled: boolean;
  default_params?: Record<string, unknown>;
}

export interface ProviderTestResponse {
  ok: boolean;
  message: string;
  latency_ms: number;
}

export interface ProviderModelSyncResponse {
  models: ProviderModel[];
  created: number;
  updated: number;
  skipped: number;
}

export interface SystemLLMConfig {
  id?: string;
  name?: string;
  purpose: string;
  provider_id: string;
  model_id?: string;
  model?: string;
  enabled: boolean;
}

export interface AssetThumbnail {
  id: string;
  asset_id: string;
  status: string;
  width?: number;
  height?: number;
  mime_type?: string;
}

export interface Tag {
  id: string;
  name: string;
  source: string;
}

export interface AssetRecord {
  id: string;
  name: string;
  media_type: string;
  mime_type?: string;
  object_key?: string;
  size?: number;
  checksum?: string;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  source_type?: string;
  deleted_at?: number;
  thumbnail?: AssetThumbnail;
  tags?: Tag[];
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  name: string;
  type: string;
  status: string;
  queue: string;
  progress?: number;
  error?: string;
  attempts?: number;
  max_attempts?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CanvasRecord {
  id: string;
  name: string;
  title?: string;
  icon?: string;
  kind?: string;
  project_id?: string;
  description?: string;
  node_count?: number;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export type CanvasNodeType =
  | "image"
  | "prompt"
  | "loop"
  | "llm"
  | "generator"
  | "msgen"
  | "video"
  | "rh"
  | "comfy"
  | "ltxDirector"
  | "output"
  | "group"
  | "promptGroup"
  | "smart-image"
  | "smart-prompt"
  | "smart-loop"
  | "smart-group";

export interface CanvasNode {
  id: string;
  type: CanvasNodeType | string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  title?: string;
  text?: string;
  name?: string;
  asset_id?: string;
  url?: string;
  prompt?: string;
  count?: number;
  mode?: string;
  model?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CanvasConnection {
  id?: string;
  from: string;
  to: string;
  kind?: string;
}

export interface CanvasViewport {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasDetail extends CanvasRecord {
  nodes?: CanvasNode[];
  connections?: CanvasConnection[];
  viewport?: CanvasViewport;
  logs?: unknown[];
  settings?: Record<string, unknown>;
}

export interface CanvasGetResponse {
  canvas: CanvasDetail;
}

export interface CanvasCreateResponse {
  canvas: CanvasRecord;
}

export interface CanvasExportPayload {
  title?: string;
  icon?: string;
  kind?: string;
  nodes?: CanvasNode[];
  connections?: CanvasConnection[];
  viewport?: CanvasViewport;
  logs?: unknown;
  settings?: unknown;
}

export interface CanvasExportResponse {
  canvas_id?: string;
  canvas: CanvasExportPayload;
}

export interface CanvasImportResponse {
  canvas: CanvasRecord;
}

export interface CanvasWorkflowPayload {
  canvas_id?: string;
  nodes?: CanvasNode[];
  connections?: CanvasConnection[];
  metadata?: Record<string, unknown>;
}

export interface CanvasWorkflowExportResponse {
  workflow: CanvasWorkflowPayload;
}

export interface CanvasWorkflowImportResponse {
  canvas: CanvasDetail;
}

export interface CanvasWorkflowPackage {
  workflow: CanvasWorkflowPayload;
  assets?: AssetRecord[];
  metadata?: Record<string, unknown>;
}

export interface CanvasWorkflowPackageExportResponse {
  package: CanvasWorkflowPackage;
  task?: Task;
}

export interface CanvasWorkflowPackageImportResponse {
  canvas: CanvasDetail;
  task?: Task;
}

export interface CanvasRunResponse {
  task: Task;
}

export interface CanvasAssetRegisterOutputResponse {
  asset: AssetRecord;
  task?: Task;
}

export interface ProviderListResponse extends ListRet {
  providers: Provider[];
}

export interface ProviderModelListResponse extends ListRet {
  models: ProviderModel[];
}

export interface SystemLLMConfigListResponse {
  configs: SystemLLMConfig[];
}

export interface AssetListResponse extends ListRet {
  assets: AssetRecord[];
}

export interface AssetSearchParseResponse {
  query: Record<string, unknown>;
  task_id?: string;
}

export interface AssetUploadResponse {
  asset: AssetRecord;
  tasks: Task[];
}

export interface AssetChunkUploadInitResponse {
  checksum: string;
  uploaded_chunks: number[];
  chunk_size: number;
  total_chunks: number;
  expires_hours: number;
}

export interface AssetChunkUploadPartResponse {
  checksum: string;
  index: number;
  size: number;
}

export interface AssetChunkUploadCancelResponse {
  checksum: string;
  deleted: boolean;
}

export interface TaskListResponse extends ListRet {
  tasks: Task[];
}

export interface CanvasListResponse {
  canvases: CanvasRecord[];
}
