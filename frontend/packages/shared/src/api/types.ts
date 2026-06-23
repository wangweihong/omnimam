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
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  source_type?: string;
  thumbnail?: AssetThumbnail;
  tags?: Tag[];
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
  kind?: string;
  description?: string;
  updated_at?: string;
}

export interface ProviderListResponse extends ListRet {
  providers: Provider[];
}

export interface ProviderModelListResponse extends ListRet {
  models: ProviderModel[];
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

export interface TaskListResponse extends ListRet {
  tasks: Task[];
}

export interface CanvasListResponse {
  canvases: CanvasRecord[];
}
