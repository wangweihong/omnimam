import { FormEvent, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Upload } from "lucide-react";
import { assetThumbnailURL, listAssets, parseAssetSearch, uploadAsset, type AssetRecord } from "@omnimam/shared";
import { ApiErrorView } from "../components/ApiErrorView";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";

export function Assets({ canWrite }: { canWrite: boolean }) {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [mediaType, setMediaType] = useState("");
  const [searchText, setSearchText] = useState("");
  const [tags, setTags] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const filters = useMemo(() => ({ media_type: mediaType || undefined, tags: tags || undefined }), [mediaType, tags]);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const resp = await listAssets(filters);
      setAssets(resp.assets || []);
    } catch (err) {
      setError(err);
    } finally {
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
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadAsset(file, uploadTags);
      }
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section>
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
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="标签过滤" />
        <input value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="上传标签，逗号分隔" />
        <button className="button" type="button" onClick={() => void load()} disabled={busy}>应用过滤</button>
      </div>
      <div className="asset-grid">
        {assets.map((asset) => (
          <article className="asset-card" key={asset.id}>
            <div className="thumb">
              {asset.thumbnail?.status === "ready" ? (
                <img src={assetThumbnailURL(asset.id)} alt={asset.name} />
              ) : (
                <span>{asset.media_type}</span>
              )}
            </div>
            <div className="asset-meta">
              <strong>{asset.name || asset.id}</strong>
              <span>{asset.mime_type || asset.format || "-"}</span>
              <span>{asset.width && asset.height ? `${asset.width}x${asset.height}` : "size pending"}</span>
              <StatusBadge value={asset.thumbnail?.status || "thumbnail pending"} />
            </div>
          </article>
        ))}
        {!assets.length && !busy ? <div className="empty">暂无资产</div> : null}
      </div>
    </section>
  );
}
