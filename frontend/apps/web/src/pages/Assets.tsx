import {
  assetContentURL,
  assetThumbnailURL,
  cancelAssetChunkUpload,
  completeAssetChunkUpload,
  deleteAsset,
  initAssetChunkUpload,
  listAssets,
  parseAssetSearch,
  renameAsset,
  uploadAsset,
  uploadAssetChunk,
  type AssetRecord,
  type Task
} from "@omnimam/shared";
import { decompressFrames, parseGIF, type ParsedFrame } from "gifuct-js";
import {
  Copy,
  Download,
  FileImage,
  FolderInput,
  Info,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { ApiErrorView } from "../components/ApiErrorView";
import { PageHeader } from "../components/PageHeader";

type ContextMenuState = {
  asset: AssetRecord;
  x: number;
  y: number;
};

type HoverAssetState = ContextMenuState;

type PreviewFrames = {
  frames: string[];
  aspectRatio: number;
};

type UploadState = {
  active: boolean;
  filename: string;
  progress: number;
  checksum?: string;
};

const CHUNK_SIZE = 1024 * 1024;
const CHUNK_UPLOAD_THRESHOLD = 1024 * 1024;

export function Assets({ canWrite }: { canWrite: boolean }) {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [selectedID, setSelectedID] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [infoAsset, setInfoAsset] = useState<AssetRecord | null>(null);
  const [previewAsset, setPreviewAsset] = useState<AssetRecord | null>(null);
  const [hoverAsset, setHoverAsset] = useState<HoverAssetState | null>(null);
  const [mediaType, setMediaType] = useState("");
  const [format, setFormat] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [searchText, setSearchText] = useState("");
  const [tags, setTags] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const stopUploadRef = useRef(false);

  const filters = useMemo(
    () => ({
      media_type: mediaType || undefined,
      format: format || undefined,
      source_type: sourceType || undefined,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      tags: tags || undefined
    }),
    [mediaType, format, sourceType, width, height, tags]
  );

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const resp = await listAssets(filters);
      setAssets(resp.assets || []);
    } catch (err) {
      if ((err as Error).message !== "upload stopped") {
        setError(err);
      }
    } finally {
      if (stopUploadRef.current) {
        setUploadState(null);
      }
      setBusy(false);
    }
  }

  async function submitNaturalSearch(event: FormEvent) {
    event.preventDefault();
    if (!searchText.trim()) return void load();
    setBusy(true);
    setError(null);
    try {
      const parsed = await parseAssetSearch(searchText.trim());
      const resp = await listAssets(parsed.query as Record<string, string | number | boolean | undefined>);
      setAssets(resp.assets || []);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    stopUploadRef.current = false;
    setBusy(true);
    setError(null);
    try {
      const tasks: Task[] = [];
      for (const file of Array.from(files)) {
        if (stopUploadRef.current) break;
        const resp = await uploadFile(file);
        tasks.push(...(resp.tasks || []));
      }
      setCreatedTasks(tasks);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    if (file.size <= CHUNK_UPLOAD_THRESHOLD) {
      setUploadState({ active: true, filename: file.name, progress: 0 });
      const resp = await uploadAsset(file, uploadTags);
      setUploadState({ active: false, filename: file.name, progress: 100 });
      return resp;
    }

    setUploadState({ active: true, filename: file.name, progress: 1 });
    const checksum = await sha256File(file);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    setUploadState({ active: true, filename: file.name, progress: 3, checksum });
    const tagNames = splitTagInput(uploadTags);
    const init = await initAssetChunkUpload({
      filename: file.name,
      size: file.size,
      checksum,
      chunk_size: CHUNK_SIZE,
      total_chunks: totalChunks,
      tag_names: tagNames,
      source_type: "user_upload"
    });
    const uploaded = new Set(init.uploaded_chunks || []);
    for (let index = 0; index < totalChunks; index++) {
      if (stopUploadRef.current) {
        await cancelAssetChunkUpload(checksum);
        throw new Error("upload stopped");
      }
      if (!uploaded.has(index)) {
        const start = index * CHUNK_SIZE;
        await uploadAssetChunk(checksum, index, file.slice(start, Math.min(file.size, start + CHUNK_SIZE)));
      }
      setUploadState({
        active: true,
        filename: file.name,
        progress: Math.round(((index + 1) / totalChunks) * 90) + 5,
        checksum
      });
    }
    const resp = await completeAssetChunkUpload({
      filename: file.name,
      size: file.size,
      checksum,
      chunk_size: CHUNK_SIZE,
      total_chunks: totalChunks,
      tag_names: tagNames,
      source_type: "user_upload"
    });
    setUploadState({ active: false, filename: file.name, progress: 100, checksum });
    return resp;
  }

  async function stopUpload() {
    stopUploadRef.current = true;
    if (uploadState?.checksum) {
      await cancelAssetChunkUpload(uploadState.checksum).catch(() => undefined);
    }
    setUploadState(null);
  }

  function openContextMenu(event: MouseEvent, asset: AssetRecord) {
    event.preventDefault();
    const menuWidth = 220;
    const menuHeight = 414;
    const x = Math.min(event.clientX, window.innerWidth - menuWidth - 12);
    const y = Math.min(event.clientY, window.innerHeight - menuHeight - 12);
    setSelectedID(asset.id);
    setContextMenu({ asset, x: Math.max(12, x), y: Math.max(12, y) });
  }

  async function renameSelected(asset: AssetRecord) {
    const name = window.prompt("Rename asset", asset.name || asset.id);
    if (!name || name === asset.name) return;
    setError(null);
    try {
      await renameAsset(asset.id, name);
      setContextMenu(null);
      await load();
    } catch (err) {
      setError(err);
    }
  }

  async function deleteSelected(asset: AssetRecord) {
    if (!window.confirm(`Delete ${asset.name || asset.id}?`)) return;
    setError(null);
    try {
      await deleteAsset(asset.id);
      setContextMenu(null);
      await load();
    } catch (err) {
      setError(err);
    }
  }

  function downloadSelected(asset: AssetRecord) {
    const link = document.createElement("a");
    link.href = assetContentURL(asset.id);
    link.download = asset.name || asset.id;
    link.click();
    setContextMenu(null);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section onClick={() => setContextMenu(null)}>
      <PageHeader
        title="资产"
        description="统一平面管理图片、视频、音频、文本和提示词资产；列表只展示 metadata 与 thumbnail。"
        actions={
          <>
            <button className="button" type="button" onClick={() => void load()} disabled={busy}>
              <RefreshCw size={16} /> 刷新
            </button>
            <label className={`button primary ${!canWrite ? "disabled" : ""}`}>
              <Upload size={16} /> 上传
              <input type="file" hidden multiple disabled={!canWrite} onChange={(e) => void handleUpload(e.target.files)} />
            </label>
          </>
        }
      />
      <ApiErrorView error={error} />
      <div className="toolbar">
        <form className="search" onSubmit={(event) => void submitNaturalSearch(event)}>
          <Search size={16} />
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="自然语言搜索，例如：1920x1680 的图片" />
        </form>
        <select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
          <option value="">全部类型</option>
          <option value="image">image</option>
          <option value="video">video</option>
          <option value="audio">audio</option>
          <option value="pdf">pdf</option>
          <option value="prompt_template">prompt_template</option>
        </select>
        <input value={format} onChange={(e) => setFormat(e.target.value)} placeholder="格式，例如 png/json/md" />
        <input value={sourceType} onChange={(e) => setSourceType(e.target.value)} placeholder="来源，例如 user_upload" />
        <input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="宽度" inputMode="numeric" />
        <input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="高度" inputMode="numeric" />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="标签过滤" />
        <input value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="上传标签，逗号分隔" />
        <button className="button" type="button" onClick={() => void load()} disabled={busy}>应用过滤</button>
      </div>
      {createdTasks.length ? (
        <div className="notice">
          <strong>已创建异步任务</strong>
          <span>{createdTasks.map((task) => `${task.type}:${task.status}`).join(" / ")}</span>
        </div>
      ) : null}
      {uploadState?.active ? (
        <div className="notice upload-progress">
          <strong>正在上传 {uploadState.filename}</strong>
          <span>{uploadState.progress}%</span>
          <button className="button subtle" type="button" onClick={() => void stopUpload()}>停止上传</button>
        </div>
      ) : null}

      <div className="asset-browser">
        {assets.map((asset) => (
          <button
            className={`asset-row ${selectedID === asset.id ? "selected" : ""}`}
            key={asset.id}
            type="button"
            onClick={() => setSelectedID(asset.id)}
            onContextMenu={(event) => openContextMenu(event, asset)}
            onDoubleClick={() => isPreviewable(asset) && setPreviewAsset(asset)}
          >
            <span
              className="asset-row-thumb"
              onMouseEnter={(event) => setHoverAsset({ asset, x: event.clientX, y: event.clientY })}
              onMouseMove={(event) => setHoverAsset({ asset, x: event.clientX, y: event.clientY })}
              onMouseLeave={() => setHoverAsset(null)}
            >
              <AssetThumbnailView asset={asset} />
            </span>
            <span className="asset-row-meta">
              <strong>{asset.name || asset.id}</strong>
              <span>{formatBytes(asset.size)} · {formatRelative(asset.createdAt || asset.created_at)}</span>
              <span>{asset.duration ? formatDuration(asset.duration) : asset.width && asset.height ? `${asset.width}x${asset.height}` : asset.media_type}</span>
            </span>
          </button>
        ))}
        {!assets.length && !busy ? <div className="empty asset-empty">暂无资产</div> : null}
      </div>

      {hoverAsset ? <AssetHoverPreview preview={hoverAsset} /> : null}

      {contextMenu ? (
        <div className="asset-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
          <button className="context-menu-add" type="button" aria-label="Add placeholder"><Plus size={22} /></button>
          <div className="context-menu-count">1</div>
          <button type="button" onClick={() => { setInfoAsset(contextMenu.asset); setContextMenu(null); }}><Info size={18} /> Info</button>
          <button type="button" onClick={() => downloadSelected(contextMenu.asset)}><Download size={18} /> Download</button>
          <button type="button" className="disabled"><Share2 size={18} /> Share</button>
          <button type="button" onClick={() => void renameSelected(contextMenu.asset)} disabled={!canWrite}><Pencil size={18} /> Rename</button>
          <button type="button" className="disabled"><Copy size={18} /> Copy file</button>
          <button type="button" className="disabled"><FolderInput size={18} /> Move file</button>
          <button type="button" className="disabled"><FileImage size={18} /> Select all</button>
          <button type="button" onClick={() => void deleteSelected(contextMenu.asset)} disabled={!canWrite}><Trash2 size={18} /> Delete</button>
        </div>
      ) : null}

      {infoAsset ? <AssetInfoDialog asset={infoAsset} onClose={() => setInfoAsset(null)} /> : null}
      {previewAsset ? <AssetPreview asset={previewAsset} onClose={() => setPreviewAsset(null)} /> : null}
    </section>
  );
}

function AssetInfoDialog({ asset, onClose }: { asset: AssetRecord; onClose: () => void }) {
  return (
    <div className="asset-modal-backdrop">
      <div className="asset-info-dialog">
        <div className="asset-dialog-title">
          <button className="dialog-close danger" type="button" onClick={onClose}><X size={18} /></button>
          <strong>File information</strong>
        </div>
        <h3>Basic Information</h3>
        <dl>
          <dt>Display Name:</dt><dd>{asset.name || asset.id}</dd>
          <dt>Size</dt><dd>{formatBytes(asset.size)}</dd>
          <dt>Type</dt><dd>{asset.mime_type || asset.media_type}</dd>
          <dt>Last modified</dt><dd>{formatDate(asset.updatedAt || asset.updated_at || asset.createdAt || asset.created_at)}</dd>
          <dt>Source</dt><dd>{asset.source_type || "-"}</dd>
          <dt>Path</dt><dd>{asset.object_key || "-"}</dd>
          <dt>Hidden</dt><dd>×</dd>
          <dt>Has Preview</dt><dd>{asset.thumbnail?.status === "ready" ? "√" : "×"}</dd>
        </dl>
        <h3>Checksums</h3>
        <dl>
          <dt>Hash Algorithm</dt><dd>SHA256</dd>
          <dt>Hash Value</dt><dd>{asset.checksum || "not available"}</dd>
        </dl>
      </div>
    </div>
  );
}

function AssetPreview({ asset, onClose }: { asset: AssetRecord; onClose: () => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isTextAsset(asset)) return;
    setText("");
    setError("");
    fetch(assetContentURL(asset.id))
      .then((resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.text();
      })
      .then(setText)
      .catch((err: Error) => setError(err.message));
  }, [asset]);

  return (
    <div className="asset-preview-page">
      <button className="preview-close" type="button" onClick={onClose}><X size={22} /></button>
      <div className="preview-title">{asset.name || asset.id}</div>
      <div className="preview-body">
        {isVideoAsset(asset) ? (
          <video src={assetContentURL(asset.id)} controls autoPlay />
        ) : isAudioAsset(asset) ? (
          <audio src={assetContentURL(asset.id)} controls autoPlay />
        ) : isTextAsset(asset) ? (
          <pre>{error || text || "loading..."}</pre>
        ) : isImageAsset(asset) ? (
          <img src={assetContentURL(asset.id)} alt={asset.name || asset.id} />
        ) : (
          <iframe title={asset.name || asset.id} src={assetContentURL(asset.id)} />
        )}
      </div>
    </div>
  );
}

function AssetThumbnailView({ asset }: { asset: AssetRecord }) {
  if (isVideoAsset(asset) || isGifAsset(asset)) {
    return <GeneratedMediaThumb asset={asset} />;
  }
  if (asset.thumbnail?.status === "ready") {
    return <img src={assetThumbnailURL(asset.id)} alt="" />;
  }
  return <span className="default-thumb"><FileImage size={22} /></span>;
}

function GeneratedMediaThumb({ asset }: { asset: AssetRecord }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let canceled = false;
    const extract = () => isGifAsset(asset) ? extractGifFrames(asset, 5) : extractVideoFrames(asset, 5);
    extract()
      .then((result) => {
        if (!canceled) setSrc(result.frames[0] || "");
      })
      .catch(() => {
        if (!canceled) setSrc("");
      });
    return () => {
      canceled = true;
    };
  }, [asset.id]);

  if (src) return <img src={src} alt="" />;
  if (asset.thumbnail?.status === "ready") return <img src={assetThumbnailURL(asset.id)} alt="" />;
  return <span className="default-thumb"><FileImage size={22} /></span>;
}

function AssetHoverPreview({ preview }: { preview: HoverAssetState }) {
  const { asset } = preview;
  const fallbackAspect = asset.width && asset.height ? asset.width / asset.height : isVideoAsset(asset) ? 16 / 9 : 1;
  const [aspectRatio, setAspectRatio] = useState(fallbackAspect);
  const style = hoverPreviewStyle(preview.x, preview.y, aspectRatio);

  if (isVideoAsset(asset) || isGifAsset(asset)) {
    return (
      <div className="asset-hover-preview animated-frame-preview" style={style}>
        <AnimatedFramePreview asset={asset} onAspectRatio={setAspectRatio} />
      </div>
    );
  }
  if (asset.thumbnail?.status === "ready") {
    return (
      <div className="asset-hover-preview" style={style}>
        <img src={assetThumbnailURL(asset.id)} alt="" />
      </div>
    );
  }
  return null;
}

function AnimatedFramePreview({ asset, onAspectRatio }: { asset: AssetRecord; onAspectRatio: (value: number) => void }) {
  const [frames, setFrames] = useState<string[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let canceled = false;
    async function extractFrames() {
      const result = isGifAsset(asset) ? await extractGifFrames(asset) : await extractVideoFrames(asset);
      if (!canceled) {
        setActive(0);
        setFrames(result.frames);
        onAspectRatio(result.aspectRatio);
      }
    }
    extractFrames().catch(() => {
      if (!canceled) setFrames([]);
    });
    return () => {
      canceled = true;
    };
  }, [asset.id]);

  useEffect(() => {
    if (frames.length <= 1) return undefined;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % frames.length), 1000);
    return () => window.clearInterval(timer);
  }, [frames.length]);

  const fallback = asset.thumbnail?.status === "ready" ? assetThumbnailURL(asset.id) : "";
  const src = frames[active] || fallback;
  return src ? <img src={src} alt="" /> : <span className="default-thumb">loading preview...</span>;
}

async function extractVideoFrames(asset: AssetRecord, frameCount = 5): Promise<PreviewFrames> {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.src = assetContentURL(asset.id);
  video.preload = "metadata";
  video.load();
  await waitForVideoEvent(video, "loadedmetadata");
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
  const safeStart = Math.min(Math.max(0.1, duration * 0.02), Math.max(0.01, duration - 0.01));
  const points = Array.from({ length: frameCount }, (_, index) => (
    frameCount === 1 ? safeStart : Math.min(duration - 0.01, safeStart + (duration - safeStart) * (index / frameCount))
  ));
  const canvas = document.createElement("canvas");
  const aspectRatio = (video.videoWidth && video.videoHeight) ? video.videoWidth / video.videoHeight : 16 / 9;
  const width = 520;
  const height = Math.max(1, Math.round(width / aspectRatio));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return { frames: [], aspectRatio };
  const frames: string[] = [];
  for (const point of points) {
    video.currentTime = point;
    await waitForVideoEvent(video, "seeked");
    context.drawImage(video, 0, 0, width, height);
    const frame = canvas.toDataURL("image/jpeg", 0.78);
    if (frames.length || !isMostlyBlack(context, width, height)) {
      frames.push(frame);
    }
  }
  if (!frames.length) {
    context.drawImage(video, 0, 0, width, height);
    frames.push(canvas.toDataURL("image/jpeg", 0.78));
  }
  return { frames, aspectRatio };
}

async function extractGifFrames(asset: AssetRecord, frameCount = 5): Promise<PreviewFrames> {
  const response = await fetch(assetContentURL(asset.id));
  if (!response.ok) throw new Error("gif preview failed");
  const parsed = parseGIF(await response.arrayBuffer());
  const decoded = decompressFrames(parsed, true);
  const width = parsed.lsd.width || asset.width || 1;
  const height = parsed.lsd.height || asset.height || 1;
  const source = document.createElement("canvas");
  const target = document.createElement("canvas");
  const sourceContext = source.getContext("2d");
  const targetContext = target.getContext("2d");
  source.width = width;
  source.height = height;
  target.width = 520;
  target.height = Math.max(1, Math.round(520 / (width / height)));
  if (!sourceContext || !targetContext) return { frames: [], aspectRatio: width / height };

  const frames: string[] = [];
  const step = Math.max(1, Math.floor(decoded.length / frameCount));
  for (let index = 0; index < decoded.length && frames.length < frameCount; index++) {
    drawGifPatch(sourceContext, decoded[index]);
    if (index % step === 0 || index === decoded.length - 1) {
      targetContext.clearRect(0, 0, target.width, target.height);
      targetContext.drawImage(source, 0, 0, target.width, target.height);
      frames.push(target.toDataURL("image/jpeg", 0.78));
    }
    disposeGifFrame(sourceContext, decoded[index]);
  }
  return { frames, aspectRatio: width / height };
}

function drawGifPatch(context: CanvasRenderingContext2D, frame: ParsedFrame) {
  const patch = document.createElement("canvas");
  const patchContext = patch.getContext("2d");
  patch.width = frame.dims.width;
  patch.height = frame.dims.height;
  if (!patchContext) return;
  const imageData = patchContext.createImageData(frame.dims.width, frame.dims.height);
  imageData.data.set(frame.patch);
  patchContext.putImageData(imageData, 0, 0);
  context.drawImage(patch, frame.dims.left, frame.dims.top);
}

function disposeGifFrame(context: CanvasRenderingContext2D, frame: ParsedFrame) {
  if (frame.disposalType === 2) {
    context.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
  }
}

function isMostlyBlack(context: CanvasRenderingContext2D, width: number, height: number) {
  const data = context.getImageData(0, 0, width, height).data;
  let dark = 0;
  const step = 16;
  for (let index = 0; index < data.length; index += 4 * step) {
    if (data[index] + data[index + 1] + data[index + 2] < 45) dark++;
  }
  return dark / Math.max(1, data.length / (4 * step)) > 0.92;
}

function hoverPreviewStyle(x: number, y: number, aspectRatio: number) {
  const width = Math.min(520, window.innerWidth - 36);
  const height = width / Math.max(0.2, aspectRatio);
  return {
    left: Math.min(Math.max(12, x + 18), Math.max(12, window.innerWidth - width - 12)),
    top: Math.min(Math.max(12, y + 18), Math.max(12, window.innerHeight - height - 12)),
    width,
    aspectRatio: String(aspectRatio)
  };
}

function waitForVideoEvent(video: HTMLVideoElement, event: "loadedmetadata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    const onDone = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("video preview failed"));
    };
    const cleanup = () => {
      video.removeEventListener(event, onDone);
      video.removeEventListener("error", onError);
    };
    video.addEventListener(event, onDone, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

async function sha256File(file: File) {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function splitTagInput(value: string) {
  return value.split(/[,，;；\n\t]/).map((item) => item.trim()).filter(Boolean);
}

function isImageAsset(asset: AssetRecord) {
  return asset.media_type === "image" || asset.mime_type?.startsWith("image/");
}

function isGifAsset(asset: AssetRecord) {
  return asset.format === "gif" || asset.mime_type === "image/gif" || asset.name?.toLowerCase().endsWith(".gif");
}

function isVideoAsset(asset: AssetRecord) {
  return asset.media_type === "video" || asset.mime_type?.startsWith("video/");
}

function isAudioAsset(asset: AssetRecord) {
  return asset.media_type === "audio" || asset.mime_type?.startsWith("audio/");
}

function isTextAsset(asset: AssetRecord) {
  const name = asset.name?.toLowerCase() || "";
  return ["text", "json", "markdown", "prompt", "prompt_template"].includes(asset.media_type) ||
    asset.mime_type?.startsWith("text/") ||
    asset.mime_type === "application/json" ||
    name.endsWith(".md") ||
    name.endsWith(".json");
}

function isPreviewable(asset: AssetRecord) {
  return isImageAsset(asset) || isVideoAsset(asset) || isAudioAsset(asset) || isTextAsset(asset) || asset.media_type === "pdf";
}

function formatBytes(size?: number) {
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(duration?: number) {
  if (!duration) return "0:00";
  const seconds = Math.floor(duration / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatRelative(value?: string) {
  if (!value) return "-";
  const then = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - then);
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "today";
  if (diff < day * 14) return `${Math.floor(diff / day)} days ago`;
  if (diff < day * 60) return `${Math.floor(diff / (day * 7))} weeks ago`;
  return new Date(value).toLocaleDateString();
}
