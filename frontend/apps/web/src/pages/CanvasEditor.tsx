import { ChangeEvent, DragEvent, MouseEvent, PointerEvent, WheelEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Archive,
  BoxSelect,
  Brush,
  ChevronLeft,
  ChevronRight,
  Circle,
  CloudLightning,
  Columns2,
  Copy,
  Crop,
  Download,
  Eraser,
  Expand,
  Eye,
  FileJson,
  FileUp,
  Film,
  FolderPlus,
  GitBranch,
  Grid3X3,
  ImageDown,
  ImagePlus,
  Keyboard,
  Library,
  Layers,
  ListTodo,
  MessageSquareText,
  MousePointer2,
  Package,
  PackageOpen,
  Paintbrush,
  Pencil,
  Play,
  RefreshCw,
  Repeat2,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Settings2,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  TextCursorInput,
  Trash2,
  Type,
  Undo2,
  Ungroup,
  UploadCloud,
  Workflow,
  Video,
  WandSparkles,
  X
} from "lucide-react";
import {
  assetContentURL,
  canvasAssetDownloadURL,
  assetThumbnailURL,
  exportCanvasWorkflow,
  exportCanvasWorkflowPackage,
  getCanvas,
  importCanvasWorkflow,
  importCanvasWorkflowPackage,
  listAssets,
  registerCanvasOutput,
  runCanvas,
  runCanvasNode,
  saveCanvas,
  uploadAsset,
  type AssetRecord,
  type CanvasConnection,
  type CanvasDetail,
  type CanvasNode,
  type CanvasNodeType,
  type CanvasViewport,
  type CanvasWorkflowPayload
} from "@omnimam/shared";
import { ApiErrorView } from "../components/ApiErrorView";

type DragState =
  | { type: "pan"; sx: number; sy: number; start: CanvasViewport }
  | { type: "node"; id: string; sx: number; sy: number; start: CanvasNode[]; cloned?: boolean }
  | { type: "resize"; id: string; sx: number; sy: number; start: CanvasNode }
  | { type: "select"; sx: number; sy: number; x: number; y: number }
  | { type: "link"; from: string; originKind: "in" | "out" }
  | { type: "minimap"; sx: number; sy: number }
  | { type: "knife"; last: { x: number; y: number }; trail: { x: number; y: number }[] };

type PointerLike = {
  clientX: number;
  clientY: number;
  target: EventTarget | null;
};

type HistoryState = {
  nodes: CanvasNode[];
  connections: CanvasConnection[];
  viewport: CanvasViewport;
};

type NodeMenuState = {
  node: CanvasNode;
  x: number;
  y: number;
  kind: "node" | "output" | "image" | "link";
};

type OutputPreviewState = {
  node: CanvasNode;
  index: number;
};

type ImageEditorState = {
  node: CanvasNode;
  mode: ImageEditMode;
};

type ImageEditMode = "preview" | "crop" | "outpaint" | "mask" | "brush" | "grid";

type PromptTemplate = {
  id: string;
  category: string;
  title: string;
  text: string;
};

type LinkMenuState = {
  originId: string;
  originKind: "in" | "out";
  x: number;
  y: number;
  point: { x: number; y: number };
};

const DEFAULT_VIEWPORT: CanvasViewport = { x: 120, y: 96, scale: 1 };
const HISTORY_MAX = 40;
const NODE_TYPES: CanvasNodeType[] = [
  "image",
  "prompt",
  "loop",
  "llm",
  "generator",
  "msgen",
  "video",
  "rh",
  "comfy",
  "ltxDirector",
  "output",
  "group",
  "promptGroup",
  "smart-image",
  "smart-prompt",
  "smart-loop",
  "smart-group"
];
const NODE_SIZE: Record<string, { w: number; h: number }> = {
  image: { w: 220, h: 170 },
  prompt: { w: 260, h: 170 },
  loop: { w: 220, h: 140 },
  llm: { w: 280, h: 180 },
  generator: { w: 260, h: 170 },
  msgen: { w: 260, h: 170 },
  video: { w: 260, h: 170 },
  rh: { w: 280, h: 190 },
  comfy: { w: 280, h: 190 },
  ltxDirector: { w: 300, h: 210 },
  output: { w: 220, h: 140 },
  group: { w: 320, h: 220 },
  promptGroup: { w: 320, h: 180 },
  "smart-image": { w: 220, h: 170 },
  "smart-prompt": { w: 280, h: 180 },
  "smart-loop": { w: 252, h: 150 },
  "smart-group": { w: 340, h: 220 }
};
const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "portrait",
    category: "摄影",
    title: "产品级肖像",
    text: "clean portrait, natural light, detailed texture, controlled background, commercial photography"
  },
  {
    id: "ideogram4",
    category: "文生图",
    title: "Ideogram 4 海报",
    text: "bold editorial poster, crisp typography, centered subject, high contrast, refined layout"
  },
  {
    id: "video-story",
    category: "视频",
    title: "分镜视频提示词",
    text: "cinematic camera move, consistent character, clear scene transition, realistic lighting, 5 second shot"
  },
  {
    id: "asset-tagging",
    category: "资产",
    title: "资产智能标签",
    text: "analyze media content and produce concise tags for subject, style, usage, quality, and risk"
  }
];

const ENGINES = ["api", "volcengine", "modelscope", "comfy", "runninghub"];
const RATIOS = ["source", "1:1", "4:3", "3:4", "16:9", "9:16", "21:9", "custom"];
const GENERATOR_TYPES = new Set(["generator", "msgen", "video", "rh", "comfy", "ltxDirector"]);
const MEDIA_OUTPUT_TYPES = new Set(["generator", "msgen", "video", "rh", "comfy", "ltxDirector"]);
const UPSTREAM_NODE_TYPES: CanvasNodeType[] = ["image", "prompt", "loop", "group", "promptGroup", "llm"];
const DOWNSTREAM_NODE_TYPES: CanvasNodeType[] = ["output", "generator", "msgen", "comfy", "rh", "ltxDirector", "video", "llm"];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function asNodes(value: unknown): CanvasNode[] {
  return Array.isArray(value) ? (value as CanvasNode[]) : [];
}

function asConnections(value: unknown): CanvasConnection[] {
  return Array.isArray(value) ? (value as CanvasConnection[]) : [];
}

function asViewport(value: unknown): CanvasViewport {
  const v = value as Partial<CanvasViewport> | undefined;
  return {
    x: Number.isFinite(Number(v?.x)) ? Number(v?.x) : DEFAULT_VIEWPORT.x,
    y: Number.isFinite(Number(v?.y)) ? Number(v?.y) : DEFAULT_VIEWPORT.y,
    scale: Number.isFinite(Number(v?.scale)) ? Math.max(0.25, Math.min(2.5, Number(v?.scale))) : DEFAULT_VIEWPORT.scale
  };
}

function nodeSize(node: CanvasNode) {
  const fallback = NODE_SIZE[node.type] || NODE_SIZE.prompt;
  return { w: Number(node.w) || fallback.w, h: Number(node.h) || fallback.h };
}

function nodeCenter(node: CanvasNode, side: "left" | "right") {
  const size = nodeSize(node);
  return {
    x: node.x + (side === "right" ? size.w : 0),
    y: node.y + size.h / 2
  };
}

function downloadJSON(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, name);
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function nodeTitle(type: string) {
  const labels: Record<string, string> = {
    image: "图片",
    prompt: "提示词",
    loop: "循环",
    llm: "LLM",
    generator: "图片生成",
    msgen: "ModelScope",
    video: "视频生成",
    rh: "RunningHub",
    comfy: "ComfyUI",
    ltxDirector: "LTX Director",
    output: "Output",
    group: "分组",
    promptGroup: "提示词组",
    "smart-image": "智能媒体",
    "smart-prompt": "智能提示词",
    "smart-loop": "智能循环",
    "smart-group": "智能分组"
  };
  return labels[type] || type;
}

function nodeIcon(type: string) {
  switch (type) {
    case "image":
      return <ImagePlus size={15} />;
    case "loop":
      return <Repeat2 size={15} />;
    case "llm":
      return <MessageSquareText size={15} />;
    case "generator":
      return <WandSparkles size={15} />;
    case "msgen":
      return <CloudLightning size={15} />;
    case "video":
      return <Video size={15} />;
    case "rh":
    case "comfy":
      return <Workflow size={15} />;
    case "ltxDirector":
      return <Film size={15} />;
    case "output":
      return <GitBranch size={15} />;
    case "group":
    case "promptGroup":
    case "smart-group":
      return <BoxSelect size={15} />;
    case "smart-prompt":
      return <Sparkles size={15} />;
    default:
      return <MousePointer2 size={15} />;
  }
}

function mediaTypeForFile(file: File) {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return "image";
}

function outputItems(node: CanvasNode) {
  return Array.isArray(node.images) ? (node.images as Record<string, unknown>[]) : [];
}

export function CanvasEditor() {
  const { canvasId = "" } = useParams();
  const navigate = useNavigate();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const workflowInputRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const historyRef = useRef<HistoryState[]>([]);
  const redoRef = useRef<HistoryState[]>([]);
  const clipboardRef = useRef<{ nodes: CanvasNode[]; connections: CanvasConnection[] } | null>(null);
  const lastMouseWorldRef = useRef<{ x: number; y: number }>(DEFAULT_VIEWPORT);
  const rKeyRef = useRef(false);
  const [canvas, setCanvas] = useState<CanvasDetail | null>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<CanvasConnection[]>([]);
  const [viewport, setViewport] = useState<CanvasViewport>(DEFAULT_VIEWPORT);
  const [selected, setSelected] = useState<string[]>([]);
  const [linkingFrom, setLinkingFrom] = useState("");
  const [tempLinkPoint, setTempLinkPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [assetPanelOpen, setAssetPanelOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [assetManagerOpen, setAssetManagerOpen] = useState(false);
  const [promptTemplateOpen, setPromptTemplateOpen] = useState(false);
  const [promptPresetOpen, setPromptPresetOpen] = useState(false);
  const [runSettingsOpen, setRunSettingsOpen] = useState(false);
  const [assetManagerTab, setAssetManagerTab] = useState<"assets" | "workflows" | "prompts">("assets");
  const [assetTab, setAssetTab] = useState<"image" | "workflow">("image");
  const [promptTemplateSearch, setPromptTemplateSearch] = useState("");
  const [promptPresetName, setPromptPresetName] = useState("默认预设");
  const [promptPresetText, setPromptPresetText] = useState("");
  const [smartPrompt, setSmartPrompt] = useState("");
  const [smartEngine, setSmartEngine] = useState("api");
  const [smartKind, setSmartKind] = useState("image");
  const [nodeMenu, setNodeMenu] = useState<NodeMenuState | null>(null);
  const [linkMenu, setLinkMenu] = useState<LinkMenuState | null>(null);
  const [hoveredConnectionID, setHoveredConnectionID] = useState("");
  const [zoomPreview, setZoomPreview] = useState(false);
  const [knifeTrail, setKnifeTrail] = useState<{ x: number; y: number }[]>([]);
  const [outputPreview, setOutputPreview] = useState<OutputPreviewState | null>(null);
  const [imageEditor, setImageEditor] = useState<ImageEditorState | null>(null);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [comparePos, setComparePos] = useState(50);
  const [brushTool, setBrushTool] = useState<"free" | "rect" | "ellipse" | "label" | "text">("free");
  const [gridRows, setGridRows] = useState(2);
  const [gridCols, setGridCols] = useState(2);
  const [gridGap, setGridGap] = useState(0);
  const [createMenu, setCreateMenu] = useState<{ x: number; y: number; point: { x: number; y: number } } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [status, setStatus] = useState("ready");
  const nodesRef = useRef<CanvasNode[]>([]);
  const connectionsRef = useRef<CanvasConnection[]>([]);
  const selectedRef = useRef<string[]>([]);
  const viewportRef = useRef<CanvasViewport>(DEFAULT_VIEWPORT);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedNodes = useMemo(() => nodes.filter((node) => selectedSet.has(node.id)), [nodes, selectedSet]);
  const activeNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const templateCategories = useMemo(() => [...new Set(PROMPT_TEMPLATES.map((item) => item.category))], []);
  const filteredTemplates = useMemo(() => {
    const keyword = promptTemplateSearch.trim().toLowerCase();
    if (!keyword) return PROMPT_TEMPLATES;
    return PROMPT_TEMPLATES.filter((item) => `${item.category} ${item.title} ${item.text}`.toLowerCase().includes(keyword));
  }, [promptTemplateSearch]);
  const selectedBounds = useMemo(() => {
    if (!selectedNodes.length) return null;
    const rects = selectedNodes.map((node) => ({ ...node, ...nodeSize(node) }));
    const x1 = Math.min(...rects.map((rect) => rect.x));
    const y1 = Math.min(...rects.map((rect) => rect.y));
    const x2 = Math.max(...rects.map((rect) => rect.x + rect.w));
    const y2 = Math.max(...rects.map((rect) => rect.y + rect.h));
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }, [selectedNodes]);
  const minimap = useMemo(() => {
    const board = boardRef.current?.getBoundingClientRect();
    const view = {
      x: -viewport.x / viewport.scale,
      y: -viewport.y / viewport.scale,
      w: (board?.width || 1000) / viewport.scale,
      h: (board?.height || 700) / viewport.scale
    };
    const rects = [...nodes.map((node) => ({ ...node, ...nodeSize(node) })), view];
    const minX = Math.min(...rects.map((rect) => rect.x));
    const minY = Math.min(...rects.map((rect) => rect.y));
    const maxX = Math.max(...rects.map((rect) => rect.x + rect.w));
    const maxY = Math.max(...rects.map((rect) => rect.y + rect.h));
    const pad = 180;
    const bounds = { x: minX - pad, y: minY - pad, w: Math.max(1, maxX - minX + pad * 2), h: Math.max(1, maxY - minY + pad * 2) };
    return { bounds, view };
  }, [nodes, viewport]);

  function cloneState(): HistoryState {
    return {
      nodes: JSON.parse(JSON.stringify(nodes)) as CanvasNode[],
      connections: JSON.parse(JSON.stringify(connections)) as CanvasConnection[],
      viewport: { ...viewport }
    };
  }

  function pushHistory() {
    historyRef.current = [...historyRef.current.slice(-(HISTORY_MAX - 1)), cloneState()];
    redoRef.current = [];
  }

  function restoreState(state: HistoryState) {
    setNodes(state.nodes);
    setConnections(state.connections);
    setViewport(state.viewport);
    setSelected([]);
  }

  function undo() {
    const prev = historyRef.current.pop();
    if (!prev) return;
    redoRef.current = [...redoRef.current.slice(-(HISTORY_MAX - 1)), cloneState()];
    restoreState(prev);
    setStatus("undo");
  }

  function redo() {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current = [...historyRef.current.slice(-(HISTORY_MAX - 1)), cloneState()];
    restoreState(next);
    setStatus("redo");
  }

  useEffect(() => {
    nodesRef.current = nodes;
    connectionsRef.current = connections;
    selectedRef.current = selected;
    viewportRef.current = viewport;
  }, [nodes, connections, selected, viewport]);

  function screenToWorld(clientX: number, clientY: number, view = viewportRef.current) {
    const rect = boardRef.current?.getBoundingClientRect();
    return {
      x: (clientX - (rect?.left || 0) - view.x) / view.scale,
      y: (clientY - (rect?.top || 0) - view.y) / view.scale
    };
  }

  function wouldCreateCycle(fromID: string, toID: string) {
    const walk = (id: string, seen = new Set<string>()): boolean => {
      if (id === fromID) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return connections.some((conn) => conn.from === id && walk(conn.to, seen));
    };
    return walk(toID);
  }

  function canConnect(fromID: string, toID: string) {
    if (!fromID || !toID || fromID === toID) return false;
    const from = nodes.find((node) => node.id === fromID);
    const to = nodes.find((node) => node.id === toID);
    if (!from || !to) return false;
    return canConnectPair(from, to, fromID, toID);
  }

  function canConnectPair(from: CanvasNode, to: CanvasNode, fromID = from.id, toID = to.id) {
    if (GENERATOR_TYPES.has(String(from.type))) {
      if (to.type === "output") return true;
      if (MEDIA_OUTPUT_TYPES.has(String(from.type)) && GENERATOR_TYPES.has(String(to.type))) return !wouldCreateCycle(fromID, toID);
      return false;
    }
    if (to.type === "loop" || to.type === "smart-loop") {
      const allowImage = Boolean(to.imageInput) && ["image", "smart-image", "group", "smart-group", "output"].includes(String(from.type));
      const allowPrompt = Boolean(to.showPrompt) && ["prompt", "smart-prompt", "promptGroup", "loop", "smart-loop", "llm"].includes(String(from.type));
      return allowImage || allowPrompt;
    }
    if (to.type === "llm") return ["prompt", "smart-prompt", "loop", "smart-loop", "promptGroup", "llm", "image", "smart-image", "group", "smart-group", "output"].includes(String(from.type));
    if (from.type === "llm") return GENERATOR_TYPES.has(String(to.type));
    return GENERATOR_TYPES.has(String(to.type)) && ["image", "smart-image", "prompt", "smart-prompt", "loop", "smart-loop", "group", "smart-group", "promptGroup", "output", "llm"].includes(String(from.type));
  }

  function linkCreateOptions(originID: string, originKind: "in" | "out") {
    const node = nodes.find((item) => item.id === originID);
    if (!node) return [];
    if (originKind === "out" && ["image", "smart-image", "prompt", "smart-prompt", "loop", "smart-loop", "group", "smart-group", "promptGroup", "llm", "output"].includes(String(node.type))) {
      return DOWNSTREAM_NODE_TYPES.filter((type) => type !== "llm" || node.type !== "output");
    }
    if (originKind === "in" && (GENERATOR_TYPES.has(String(node.type)) || node.type === "llm")) {
      return UPSTREAM_NODE_TYPES;
    }
    return [];
  }

  function deleteConnection(id?: string) {
    if (!id) return;
    pushHistory();
    setConnections((prev) => prev.filter((conn) => conn.id !== id));
    setHoveredConnectionID("");
  }

  function distanceToSegment(point: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = dx * dx + dy * dy;
    if (!len) return Math.hypot(point.x - a.x, point.y - a.y);
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len));
    return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
  }

  function knifeCutConnections(from: { x: number; y: number }, to: { x: number; y: number }) {
    const threshold = Math.max(8, 12 / viewport.scale);
    const kept = connections.filter((conn) => {
      const aNode = nodes.find((node) => node.id === conn.from);
      const bNode = nodes.find((node) => node.id === conn.to);
      if (!aNode || !bNode) return false;
      const a = nodeCenter(aNode, "right");
      const b = nodeCenter(bNode, "left");
      const d1 = distanceToSegment(a, from, to);
      const d2 = distanceToSegment(b, from, to);
      const dm = distanceToSegment({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, from, to);
      return Math.min(d1, d2, dm) > threshold;
    });
    if (kept.length !== connections.length) {
      pushHistory();
      setConnections(kept);
    }
  }

  async function load() {
    setStatus("loading");
    setError(null);
    try {
      const resp = await getCanvas(canvasId);
      const data = resp.canvas;
      setCanvas(data);
      setNodes(asNodes(data.nodes));
      setConnections(asConnections(data.connections));
      setViewport(asViewport(data.viewport));
      setSelected([]);
      historyRef.current = [];
      redoRef.current = [];
      setStatus("ready");
    } catch (err) {
      setError(err);
      setStatus("failed");
    }
  }

  async function loadAssets() {
    try {
      const resp = await listAssets({ page_size: 48 });
      setAssets(resp.assets || []);
    } catch {
      setAssets([]);
    }
  }

  async function persist() {
    if (!canvas) return;
    setStatus("saving");
    setError(null);
    try {
      const updated = await saveCanvas(canvas.id, {
        title: canvas.title || "未命名画布",
        icon: canvas.icon || (canvas.kind === "smart" ? "sparkles" : "layers"),
        kind: canvas.kind || "classic",
        nodes,
        connections,
        viewport,
        logs: Array.isArray(canvas.logs) ? canvas.logs : [],
        settings: canvas.settings || {}
      });
      setCanvas((prev) => ({ ...(prev || canvas), ...updated, nodes, connections, viewport }));
      setStatus("saved");
    } catch (err) {
      setError(err);
      setStatus("failed");
    }
  }

  function addNode(type: CanvasNodeType, point?: { x: number; y: number }, patch: Partial<CanvasNode> = {}, recordHistory = true) {
    if (recordHistory) pushHistory();
    const size = NODE_SIZE[type] || NODE_SIZE.prompt;
    const p = point || screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const node: CanvasNode = {
      id: uid(type),
      type,
      x: Math.round(p.x - size.w / 2),
      y: Math.round(p.y - size.h / 2),
      w: size.w,
      h: size.h,
      title: nodeTitle(type),
      ...patch
    };
    setNodes((prev) => [...prev, node]);
    setSelected([node.id]);
    setCreateMenu(null);
  }

  function addNodeFromCreateMenu(event: MouseEvent<HTMLButtonElement>, type: CanvasNodeType, point: { x: number; y: number }) {
    event.preventDefault();
    event.stopPropagation();
    addNode(type, point);
    setCreateMenu(null);
  }

  function updateNode(id: string, patch: Partial<CanvasNode>) {
    setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, ...patch } : node)));
  }

  function deleteSelected() {
    if (!selected.length) return;
    pushHistory();
    const ids = new Set(selected);
    setNodes((prev) => prev.filter((node) => !ids.has(node.id)));
    setConnections((prev) => prev.filter((conn) => !ids.has(conn.from) && !ids.has(conn.to)));
    setSelected([]);
  }

  function createConnection(from: string, to: string) {
    if (!canConnect(from, to)) {
      setStatus("connection not allowed");
      return;
    }
    pushHistory();
    setConnections((prev) => [
      ...prev.filter((conn) => !(conn.from === from && conn.to === to)),
      { id: uid("link"), from, to, kind: "flow" }
    ]);
  }

  function connect(to: string) {
    if (!linkingFrom || linkingFrom === to) return;
    createConnection(linkingFrom, to);
    setLinkingFrom("");
  }

  function addLinkedNode(type: CanvasNodeType, origin: CanvasNode, direction: "downstream" | "upstream", point?: { x: number; y: number }) {
    const size = nodeSize(origin);
    const fallback =
      direction === "downstream"
        ? { x: origin.x + size.w + 180, y: origin.y + size.h / 2 }
        : { x: origin.x - 180, y: origin.y + size.h / 2 };
    const p = point || fallback;
    pushHistory();
    const nextSize = NODE_SIZE[type] || NODE_SIZE.prompt;
    const node: CanvasNode = {
      id: uid(type),
      type,
      title: nodeTitle(type),
      x: Math.round(p.x - nextSize.w / 2),
      y: Math.round(p.y - nextSize.h / 2),
      w: nextSize.w,
      h: nextSize.h
    };
    setNodes((prev) => [...prev, node]);
    const from = direction === "downstream" ? origin.id : node.id;
    const to = direction === "downstream" ? node.id : origin.id;
    const fromNode = direction === "downstream" ? origin : node;
    const toNode = direction === "downstream" ? node : origin;
    if (canConnectPair(fromNode, toNode, from, to)) {
      setConnections((prev) => [...prev, { id: uid("link"), from, to, kind: "flow" }]);
    }
    setSelected([node.id]);
    setNodeMenu(null);
    setLinkMenu(null);
  }

  function openNodeContext(event: MouseEvent<HTMLDivElement>, node: CanvasNode) {
    event.preventDefault();
    event.stopPropagation();
    const kind = node.type === "output" ? "output" : node.type === "image" || node.type === "smart-image" ? "image" : "node";
    setSelected([node.id]);
    setNodeMenu({ node, x: event.clientX, y: event.clientY, kind });
    setCreateMenu(null);
  }

  function openNodePreview(node: CanvasNode, index = 0) {
    if (node.type === "output") {
      setOutputPreview({ node, index });
      return;
    }
    if (node.type === "image" || node.type === "smart-image" || node.asset_id || node.url) {
      setImageEditor({ node, mode: "preview" });
    }
  }

  function openEditorForSelected(mode: ImageEditMode = "preview") {
    const node = activeNode || selectedNodes.find((item) => item.asset_id || item.url);
    if (!node) return;
    setImageEditor({ node, mode });
    setNodeMenu(null);
  }

  function currentMediaURL(node?: CanvasNode | null) {
    if (!node) return "";
    return node.asset_id ? assetContentURL(String(node.asset_id)) : String(node.url || "");
  }

  function currentThumbnailURL(node?: CanvasNode | null) {
    if (!node) return "";
    return node.asset_id ? assetThumbnailURL(String(node.asset_id)) : String(node.url || "");
  }

  function insertTemplateText(text: string) {
    const node = activeNode;
    if (node && ["prompt", "llm", "smart-prompt"].includes(String(node.type))) {
      updateNode(node.id, { text: `${String(node.text || "")}${String(node.text || "").trim() ? "\n" : ""}${text}` });
    } else {
      addNode(canvas?.kind === "smart" ? "smart-prompt" : "prompt", lastMouseWorldRef.current, { text });
    }
    setPromptTemplateOpen(false);
  }

  function saveActivePromptAsPreset() {
    const text = String(activeNode?.text || smartPrompt || "");
    setPromptPresetText(text);
    setPromptPresetOpen(true);
  }

  function applyPromptPreset() {
    if (!promptPresetText.trim()) return;
    insertTemplateText(promptPresetText);
    setPromptPresetOpen(false);
  }

  async function runSmartComposer(cascade = false) {
    const point = lastMouseWorldRef.current;
    const promptText = smartPrompt.trim();
    if (promptText) {
      addNode("smart-prompt", point, { text: promptText, engine: smartEngine, kind: smartKind }, true);
    }
    setCanvas((prev) =>
      prev
        ? {
            ...prev,
            settings: {
              ...(prev.settings || {}),
              smart_engine: smartEngine,
              smart_kind: smartKind,
              smart_prompt: promptText,
              cascade
            }
          }
        : prev
    );
    await run();
  }

  function updateCanvasSetting(key: string, value: unknown) {
    setCanvas((prev) => (prev ? { ...prev, settings: { ...(prev.settings || {}), [key]: value } } : prev));
  }

  function canvasToFile(canvasEl: HTMLCanvasElement, filename: string) {
    return new Promise<File>((resolve, reject) => {
      canvasEl.toBlob((blob) => {
        if (!blob) reject(new Error("canvas export failed"));
        else resolve(new File([blob], filename, { type: "image/png" }));
      }, "image/png");
    });
  }

  async function imageBitmapFromURL(url: string) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(await resp.text());
    return createImageBitmap(await resp.blob());
  }

  async function videoFrameFile(url: string, filename: string) {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("video load failed"));
    });
    video.currentTime = Math.min(Math.max(0.1, video.duration / 2), Math.max(0.1, video.duration - 0.1));
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("video seek failed"));
    });
    const canvasEl = document.createElement("canvas");
    canvasEl.width = video.videoWidth || 1280;
    canvasEl.height = video.videoHeight || 720;
    canvasEl.getContext("2d")?.drawImage(video, 0, 0, canvasEl.width, canvasEl.height);
    return canvasToFile(canvasEl, filename);
  }

  async function uploadDerivedImage(file: File, sourceNode: CanvasNode, pointOffset = { x: 36, y: 36 }) {
    const resp = await uploadAsset(file, "canvas,derived", "generated");
    const point = { x: sourceNode.x + pointOffset.x, y: sourceNode.y + pointOffset.y };
    addNode("image", point, {
      name: resp.asset.name,
      asset_id: resp.asset.id,
      url: assetContentURL(resp.asset.id),
      media_type: resp.asset.media_type || "image",
      mime_type: resp.asset.mime_type || file.type
    }, false);
    return resp.asset;
  }

  async function applyImageEdit() {
    if (!imageEditor) return;
    const source = currentMediaURL(imageEditor.node) || currentThumbnailURL(imageEditor.node);
    if (!source) return;
    setStatus(`${imageEditor.mode} editing`);
    try {
      if (imageEditor.mode === "preview" && String(imageEditor.node.media_type || imageEditor.node.mime_type || "").startsWith("video")) {
        const file = await videoFrameFile(source, `${imageEditor.node.name || "video-frame"}.png`);
        await uploadDerivedImage(file, imageEditor.node);
      } else if (imageEditor.mode === "crop" || imageEditor.mode === "brush") {
        const bitmap = await imageBitmapFromURL(source);
        const canvasEl = document.createElement("canvas");
        const crop = imageEditor.mode === "crop";
        const sx = crop ? Math.round(bitmap.width * 0.1) : 0;
        const sy = crop ? Math.round(bitmap.height * 0.1) : 0;
        const sw = crop ? Math.round(bitmap.width * 0.8) : bitmap.width;
        const sh = crop ? Math.round(bitmap.height * 0.8) : bitmap.height;
        canvasEl.width = sw;
        canvasEl.height = sh;
        const ctx = canvasEl.getContext("2d");
        ctx?.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
        if (imageEditor.mode === "brush" && ctx) {
          ctx.fillStyle = "rgba(255,45,85,.28)";
          ctx.beginPath();
          ctx.ellipse(sw / 2, sh / 2, sw / 4, sh / 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#111827";
          ctx.font = "24px sans-serif";
          ctx.fillText(String(brushTool), 24, 42);
        }
        const file = await canvasToFile(canvasEl, `${imageEditor.node.name || imageEditor.mode}.png`);
        await uploadDerivedImage(file, imageEditor.node);
      } else if (imageEditor.mode === "grid") {
        const bitmap = await imageBitmapFromURL(source);
        const rows = Math.max(1, gridRows);
        const cols = Math.max(1, gridCols);
        const cellW = Math.floor(bitmap.width / cols);
        const cellH = Math.floor(bitmap.height / rows);
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const canvasEl = document.createElement("canvas");
            canvasEl.width = cellW;
            canvasEl.height = cellH;
            canvasEl.getContext("2d")?.drawImage(bitmap, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
            const file = await canvasToFile(canvasEl, `${imageEditor.node.name || "grid"}-${row + 1}-${col + 1}.png`);
            await uploadDerivedImage(file, imageEditor.node, { x: 36 + col * 48, y: 36 + row * 48 });
          }
        }
      } else if (canvas) {
        await runCanvasNode(canvas.id, imageEditor.node.id, { node: imageEditor.node, edit_mode: imageEditor.mode, settings: canvas.settings || {} });
      }
      updateNode(imageEditor.node.id, {
        edit_state: {
          ...((imageEditor.node.edit_state as Record<string, unknown>) || {}),
          last_edit_mode: imageEditor.mode,
          grid_rows: gridRows,
          grid_cols: gridCols,
          grid_gap: gridGap,
          brush_tool: brushTool,
          edited_at: new Date().toISOString()
        }
      });
      await loadAssets();
      setStatus(`${imageEditor.mode} edit applied`);
      setImageEditor(null);
    } catch (err) {
      setError(err);
      setStatus("failed");
    }
  }

  function startLink(event: PointerEvent<HTMLButtonElement>, from: string, originKind: "in" | "out" = "out") {
    event.preventDefault();
    event.stopPropagation();
    setLinkingFrom(from);
    setTempLinkPoint(screenToWorld(event.clientX, event.clientY));
    setLinkMenu(null);
    dragRef.current = { type: "link", from, originKind };
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const nextScale = Math.max(0.25, Math.min(2.5, viewport.scale * (event.deltaY < 0 ? 1.1 : 0.9)));
    const rect = boardRef.current?.getBoundingClientRect();
    const mx = event.clientX - (rect?.left || 0);
    const my = event.clientY - (rect?.top || 0);
    const wx = (mx - viewport.x) / viewport.scale;
    const wy = (my - viewport.y) / viewport.scale;
    setViewport({ x: mx - wx * nextScale, y: my - wy * nextScale, scale: nextScale });
  }

  function onBoardPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest(".canvas-node,.canvas-create-menu,.canvas-node-menu,.canvas-minimap")) return;
    if (event.button !== 0 && event.button !== 1) return;
    const world = screenToWorld(event.clientX, event.clientY);
    lastMouseWorldRef.current = world;
    setCreateMenu(null);
    setLinkMenu(null);
    setNodeMenu(null);
    if (event.shiftKey && event.button === 0) {
      dragRef.current = { type: "knife", last: world, trail: [world] };
      setKnifeTrail([world]);
      return;
    }
    if (event.ctrlKey || event.metaKey || rKeyRef.current) {
      dragRef.current = { type: "select", sx: event.clientX, sy: event.clientY, x: world.x, y: world.y };
      setSelectionBox({ x: world.x, y: world.y, w: 1, h: 1 });
    } else {
      dragRef.current = { type: "pan", sx: event.clientX, sy: event.clientY, start: viewport };
      if (event.button === 0) setSelected([]);
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onNodePointerDown(event: PointerEvent<HTMLDivElement>, node: CanvasNode) {
    if ((event.target as HTMLElement).closest("button,input,textarea,select")) return;
    event.stopPropagation();
    let startNodes = nodes;
    let dragID = node.id;
    if (event.altKey) {
      pushHistory();
      const clone: CanvasNode = { ...JSON.parse(JSON.stringify(node)), id: uid(String(node.type)), x: node.x + 28, y: node.y + 28 };
      startNodes = [...nodes, clone];
      setNodes(startNodes);
      setSelected([clone.id]);
      dragID = clone.id;
    }
    const nextSelected = event.shiftKey
      ? selectedSet.has(node.id)
        ? selected.filter((id) => id !== node.id)
        : [...selected, node.id]
      : selectedSet.has(node.id)
        ? selected
        : [dragID];
    if (!event.altKey) setSelected(nextSelected);
    dragRef.current = { type: "node", id: dragID, sx: event.clientX, sy: event.clientY, start: startNodes, cloned: event.altKey };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function startResize(event: PointerEvent<HTMLButtonElement>, node: CanvasNode) {
    event.preventDefault();
    event.stopPropagation();
    pushHistory();
    dragRef.current = { type: "resize", id: node.id, sx: event.clientX, sy: event.clientY, start: { ...node } };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function updateGroupMembership(movedNodes: CanvasNode[]) {
    if (!movedNodes.length) return;
    const currentNodes = nodesRef.current;
    const groups = currentNodes.filter((node) => node.type === "group" || node.type === "smart-group" || node.type === "promptGroup");
    if (!groups.length) return;
    const movedIDs = new Set(movedNodes.map((node) => node.id));
    const next = currentNodes.map((node) => {
      if (!groups.some((group) => group.id === node.id)) return node;
      const groupSize = nodeSize(node);
      const members = new Set(Array.isArray(node.items) ? node.items.map(String) : []);
      movedNodes.forEach((moved) => {
        if (moved.id === node.id) return;
        const movedSize = nodeSize(moved);
        const inside =
          moved.x >= node.x &&
          moved.y >= node.y &&
          moved.x + movedSize.w <= node.x + groupSize.w &&
          moved.y + movedSize.h <= node.y + groupSize.h;
        if (inside) members.add(moved.id);
        else if (movedIDs.has(moved.id)) members.delete(moved.id);
      });
      return { ...node, items: [...members] };
    });
    setNodes(next);
  }

  function handlePointerMove(event: PointerLike) {
    lastMouseWorldRef.current = screenToWorld(event.clientX, event.clientY);
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.type === "pan") {
      setViewport({ ...drag.start, x: drag.start.x + event.clientX - drag.sx, y: drag.start.y + event.clientY - drag.sy });
      return;
    }
    if (drag.type === "node") {
      const scale = viewportRef.current.scale;
      const dx = (event.clientX - drag.sx) / scale;
      const dy = (event.clientY - drag.sy) / scale;
      const currentSelected = selectedRef.current;
      const ids = currentSelected.length && !drag.cloned ? new Set(currentSelected) : new Set([drag.id]);
      drag.start.forEach((node) => {
        if (ids.has(node.id) && Array.isArray(node.items)) node.items.map(String).forEach((id) => ids.add(id));
      });
      setNodes(drag.start.map((node) => (ids.has(node.id) ? { ...node, x: Math.round(node.x + dx), y: Math.round(node.y + dy) } : node)));
      return;
    }
    if (drag.type === "resize") {
      const scale = viewportRef.current.scale;
      const dx = (event.clientX - drag.sx) / scale;
      const dy = (event.clientY - drag.sy) / scale;
      setNodes((prev) =>
        prev.map((node) =>
          node.id === drag.id
            ? { ...node, w: Math.max(160, Math.round(Number(drag.start.w || nodeSize(drag.start).w) + dx)), h: Math.max(96, Math.round(Number(drag.start.h || nodeSize(drag.start).h) + dy)) }
            : node
        )
      );
      return;
    }
    if (drag.type === "minimap") {
      centerFromMinimap(event.clientX, event.clientY);
      return;
    }
    if (drag.type === "link") {
      setTempLinkPoint(screenToWorld(event.clientX, event.clientY));
      return;
    }
    if (drag.type === "knife") {
      const point = screenToWorld(event.clientX, event.clientY);
      knifeCutConnections(drag.last, point);
      const trail = [...drag.trail.slice(-80), point];
      dragRef.current = { ...drag, last: point, trail };
      setKnifeTrail(trail);
      return;
    }
    const world = screenToWorld(event.clientX, event.clientY);
    const x = Math.min(drag.x, world.x);
    const y = Math.min(drag.y, world.y);
    const w = Math.abs(world.x - drag.x);
    const h = Math.abs(world.y - drag.y);
    setSelectionBox({ x, y, w, h });
    setSelected(
      nodesRef.current
        .filter((node) => {
          const size = nodeSize(node);
          return node.x >= x && node.y >= y && node.x + size.w <= x + w && node.y + size.h <= y + h;
        })
        .map((node) => node.id)
    );
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    handlePointerMove(event);
  }

  function handlePointerUp(event: PointerLike) {
    const drag = dragRef.current;
    if (drag?.type === "node") {
      const currentSelected = selectedRef.current;
      const movedIDs = currentSelected.length && !drag.cloned ? new Set(currentSelected) : new Set([drag.id]);
      updateGroupMembership(nodesRef.current.filter((node) => movedIDs.has(node.id)));
    }
    if (drag?.type === "link") {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-node-id]");
      const to = target?.dataset.nodeId || "";
      if (to && to !== drag.from) {
        const fromID = drag.originKind === "out" ? drag.from : to;
        const toID = drag.originKind === "out" ? to : drag.from;
        createConnection(fromID, toID);
        setLinkingFrom("");
      } else {
        const origin = nodesRef.current.find((node) => node.id === drag.from);
        const point = screenToWorld(event.clientX, event.clientY);
        if (drag.originKind === "out" && origin && GENERATOR_TYPES.has(String(origin.type))) {
          addLinkedNode("output", origin, "downstream", point);
        } else if (origin && linkCreateOptions(origin.id, drag.originKind).length) {
          const rect = boardRef.current?.getBoundingClientRect();
          setLinkMenu({
            originId: origin.id,
            originKind: drag.originKind,
            x: event.clientX - (rect?.left || 0),
            y: event.clientY - (rect?.top || 0),
            point
          });
        }
      }
      setTempLinkPoint(null);
      setLinkingFrom("");
    }
    dragRef.current = null;
    setSelectionBox(null);
    setKnifeTrail([]);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    handlePointerUp(event);
  }

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const assetJSON = event.dataTransfer.getData("application/json");
    if (assetJSON) {
      try {
        const asset = JSON.parse(assetJSON) as AssetRecord;
        const point = screenToWorld(event.clientX, event.clientY);
        addNode("image", point, { name: asset.name, asset_id: asset.id, url: assetContentURL(asset.id), media_type: asset.media_type, mime_type: asset.mime_type });
        return;
      } catch {
        // Continue with file handling when drag data is not an OmniMAM asset.
      }
    }
    const files = Array.from(event.dataTransfer.files || []).filter((file) => /^(image|audio|video|text|application)\//.test(file.type));
    if (!files.length) return;
    pushHistory();
    const point = screenToWorld(event.clientX, event.clientY);
    setStatus("uploading");
    try {
      for (const [index, file] of files.entries()) {
        const resp = await uploadAsset(file, "canvas");
        addNode("image", { x: point.x + index * 28, y: point.y + index * 28 }, {
          name: resp.asset.name,
          asset_id: resp.asset.id,
          url: assetContentURL(resp.asset.id),
          media_type: mediaTypeForFile(file),
          mime_type: file.type
        }, false);
      }
      await loadAssets();
      setStatus("ready");
    } catch (err) {
      setError(err);
      setStatus("failed");
    }
  }

  async function exportWorkflowJSON() {
    if (!canvas) return;
    const ids = new Set(selected);
    const payload = {
      nodes: nodes.filter((node) => ids.has(node.id)),
      connections: connections.filter((conn) => ids.has(conn.from) && ids.has(conn.to)),
      metadata: { title: canvas.title || canvas.id }
    };
    const resp = await exportCanvasWorkflow(canvas.id, payload);
    downloadJSON(`${canvas.title || canvas.id}.workflow.json`, resp.workflow);
  }

  async function importWorkflowPayloadFile(file: File) {
    if (!file || !canvas) return;
    try {
      pushHistory();
      const workflow = JSON.parse(await file.text()) as
        | CanvasWorkflowPayload
        | { workflow?: CanvasWorkflowPayload }
        | { package?: Record<string, unknown> };
      const resp =
        typeof workflow === "object" && workflow !== null && "package" in workflow && workflow.package
          ? await importCanvasWorkflowPackage(canvas.id, workflow.package)
          : await importCanvasWorkflow(
              canvas.id,
              (typeof workflow === "object" && workflow !== null && "workflow" in workflow && workflow.workflow ? workflow.workflow : workflow) as CanvasWorkflowPayload
            );
      setNodes(asNodes(resp.canvas.nodes));
      setConnections(asConnections(resp.canvas.connections));
      setCanvas((prev) => ({ ...(prev || canvas), ...resp.canvas }));
      setWorkflowOpen(false);
    } catch (err) {
      setError(err);
    }
  }

  async function importWorkflowFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await importWorkflowPayloadFile(file);
  }

  async function run() {
    if (!canvas) return;
    try {
      await persist();
      const resp = await runCanvas(canvas.id);
      setStatus(`task ${resp.task.id}`);
    } catch (err) {
      setError(err);
      setStatus("failed");
    }
  }

  async function runSelectedNode() {
    if (!canvas || selectedNodes.length !== 1) return;
    await runNode(selectedNodes[0]);
  }

  async function runNode(node: CanvasNode) {
    if (!canvas || !node) return;
    try {
      await persist();
      const resp = await runCanvasNode(canvas.id, node.id, { node, settings: canvas.settings || {} });
      setStatus(`node task ${resp.task.id}`);
    } catch (err) {
      setError(err);
      setStatus("failed");
    }
  }

  function nodeAssetIDs(items: CanvasNode[] = nodes) {
    const ids = new Set<string>();
    const visit = (value: unknown) => {
      if (!value) return;
      if (typeof value === "object") {
        const record = value as Record<string, unknown>;
        if (typeof record.asset_id === "string" && record.asset_id) ids.add(record.asset_id);
        Object.values(record).forEach(visit);
      } else if (Array.isArray(value)) {
        value.forEach(visit);
      }
    };
    items.forEach(visit);
    return [...ids];
  }

  async function exportWorkflowPackageJSON() {
    if (!canvas) return;
    const ids = new Set(selected);
    const picked = nodes.filter((node) => ids.has(node.id));
    const payload = {
      nodes: picked,
      connections: connections.filter((conn) => ids.has(conn.from) && ids.has(conn.to)),
      metadata: { title: canvas.title || canvas.id },
      asset_ids: nodeAssetIDs(picked),
      filename: `${canvas.title || canvas.id}.workflow-package.json`
    };
    const resp = await exportCanvasWorkflowPackage(canvas.id, payload);
    downloadJSON(`${canvas.title || canvas.id}.workflow-package.json`, { package: resp.package });
  }

  async function downloadSelectedAssets() {
    const ids = nodeAssetIDs(selectedNodes);
    if (!ids.length) {
      setStatus("no assets selected");
      return;
    }
    try {
      const resp = await fetch(canvasAssetDownloadURL(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_ids: ids, filename: `${canvas?.title || "canvas-assets"}.zip` })
      });
      if (!resp.ok) throw new Error(await resp.text());
      const blob = await resp.blob();
      downloadBlob(blob, `${canvas?.title || "canvas-assets"}.zip`);
    } catch (err) {
      setError(err);
    }
  }

  async function downloadOutputAssets(node: CanvasNode) {
    const items = outputItems(node);
    const assetIDs = items.map((item) => String(item.asset_id || "")).filter(Boolean);
    if (!assetIDs.length) {
      setStatus("no output assets");
      return;
    }
    try {
      const resp = await fetch(canvasAssetDownloadURL(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_ids: assetIDs, filename: `${node.name || node.title || "output-assets"}.zip` })
      });
      if (!resp.ok) throw new Error(await resp.text());
      downloadBlob(await resp.blob(), `${node.name || node.title || "output-assets"}.zip`);
    } catch (err) {
      setError(err);
    }
  }

  function convertOutput(copyOnly: boolean) {
    const output = selectedNodes.find((node) => node.type === "output");
    if (!output) return;
    const items = outputItems(output).filter((item) => typeof item.asset_id === "string" || typeof item.url === "string");
    if (!items.length) return;
    pushHistory();
    const created = items.map((item, index) => ({
      id: uid("image"),
      type: "image",
      x: output.x + 28 + index * 28,
      y: output.y + 60 + index * 28,
      w: NODE_SIZE.image.w,
      h: NODE_SIZE.image.h,
      title: "图片",
      name: String(item.name || `output-${index + 1}`),
      asset_id: item.asset_id,
      url: item.asset_id ? assetContentURL(String(item.asset_id)) : item.url,
      media_type: item.media_type || "image",
      mime_type: item.mime_type
    })) as CanvasNode[];
    const group: CanvasNode = {
      id: uid("group"),
      type: "group",
      title: "输出分组",
      x: output.x,
      y: output.y + 40,
      w: Math.max(320, NODE_SIZE.image.w + 56),
      h: Math.max(180, created.length * 44 + 120),
      items: created.map((node) => node.id)
    };
    setNodes((prev) => (copyOnly ? [...prev, ...created, group] : prev.filter((node) => node.id !== output.id).concat(created, group)));
    setConnections((prev) => (copyOnly ? prev : prev.filter((conn) => conn.from !== output.id && conn.to !== output.id)));
    setSelected([group.id]);
  }

  async function registerSelectedOutput() {
    if (!canvas) return;
    const node = selectedNodes[0];
    const assetID = String(node?.asset_id || "");
    if (!node || !assetID) return;
    try {
      const resp = await registerCanvasOutput({ canvas_id: canvas.id, node_id: node.id, asset_id: assetID, metadata: { node_type: node.type } });
      setStatus(`registered ${resp.asset.id}`);
    } catch (err) {
      setError(err);
    }
  }

  function copySelected() {
    if (!selected.length) return;
    const ids = new Set(selected);
    clipboardRef.current = {
      nodes: JSON.parse(JSON.stringify(nodes.filter((node) => ids.has(node.id)))) as CanvasNode[],
      connections: JSON.parse(JSON.stringify(connections.filter((conn) => ids.has(conn.from) && ids.has(conn.to)))) as CanvasConnection[]
    };
    setStatus(`copied ${clipboardRef.current.nodes.length}`);
  }

  function pasteSelected() {
    const clip = clipboardRef.current;
    if (!clip?.nodes.length) return;
    pushHistory();
    const xs = clip.nodes.map((node) => node.x);
    const ys = clip.nodes.map((node) => node.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const target = lastMouseWorldRef.current;
    const idMap = new Map<string, string>();
    const copied = clip.nodes.map((node) => {
      const next: CanvasNode = { ...node, id: uid(String(node.type)), x: Math.round(node.x + target.x - cx), y: Math.round(node.y + target.y - cy) };
      idMap.set(node.id, next.id);
      if (Array.isArray(next.items)) next.items = next.items.map((id: unknown) => idMap.get(String(id)) || id);
      return next;
    });
    const copiedConnections = clip.connections
      .map((conn) => ({ ...conn, id: uid("link"), from: idMap.get(conn.from) || "", to: idMap.get(conn.to) || "" }))
      .filter((conn) => conn.from && conn.to);
    setNodes((prev) => [...prev, ...copied]);
    setConnections((prev) => [...prev, ...copiedConnections]);
    setSelected(copied.map((node) => node.id));
    setStatus(`pasted ${copied.length}`);
  }

  function groupSelected() {
    if (!selectedNodes.length || !selectedBounds) return;
    pushHistory();
    const group: CanvasNode = {
      id: uid("group"),
      type: "group",
      title: "分组",
      x: Math.round(selectedBounds.x - 24),
      y: Math.round(selectedBounds.y - 54),
      w: Math.round(Math.max(320, selectedBounds.w + 48)),
      h: Math.round(Math.max(180, selectedBounds.h + 84)),
      items: selectedNodes.map((node) => node.id)
    };
    setNodes((prev) => [...prev, group]);
    setSelected([group.id]);
  }

  function ungroupSelected() {
    const groups = selectedNodes.filter((node) => node.type === "group");
    if (!groups.length) return;
    pushHistory();
    const ids = new Set(groups.map((node) => node.id));
    setNodes((prev) => prev.filter((node) => !ids.has(node.id)));
    setConnections((prev) => prev.filter((conn) => !ids.has(conn.from) && !ids.has(conn.to)));
    setSelected(groups.flatMap((node) => (Array.isArray(node.items) ? node.items.map(String) : [])));
  }

  function fitAllNodes() {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (!nodes.length) {
      setViewport({ x: rect.width / 2, y: rect.height / 2, scale: 0.5 });
      return;
    }
    const rects = nodes.map((node) => ({ ...node, ...nodeSize(node) }));
    const minX = Math.min(...rects.map((item) => item.x));
    const minY = Math.min(...rects.map((item) => item.y));
    const maxX = Math.max(...rects.map((item) => item.x + item.w));
    const maxY = Math.max(...rects.map((item) => item.y + item.h));
    const scale = Math.max(0.25, Math.min(1.2, (rect.width - 96) / Math.max(1, maxX - minX + 240), (rect.height - 96) / Math.max(1, maxY - minY + 240)));
    setViewport({ x: rect.width / 2 - ((minX + maxX) / 2) * scale, y: rect.height / 2 - ((minY + maxY) / 2) * scale, scale });
  }

  function centerFromMinimap(clientX: number, clientY: number) {
    const rect = (document.querySelector(".canvas-minimap") as HTMLElement | null)?.getBoundingClientRect();
    const board = boardRef.current?.getBoundingClientRect();
    if (!rect || !board) return;
    const { bounds } = minimap;
    const world = {
      x: bounds.x + ((clientX - rect.left) / rect.width) * bounds.w,
      y: bounds.y + ((clientY - rect.top) / rect.height) * bounds.h
    };
    setViewport((prev) => ({ ...prev, x: board.width / 2 - world.x * prev.scale, y: board.height / 2 - world.y * prev.scale }));
  }

  function onMinimapPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    dragRef.current = { type: "minimap", sx: event.clientX, sy: event.clientY };
    centerFromMinimap(event.clientX, event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function openCreateMenu(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest(".canvas-node,.canvas-create-menu,.canvas-node-menu,.canvas-minimap,.canvas-side-panel,.canvas-selection-hub")) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = boardRef.current?.getBoundingClientRect();
    const point = screenToWorld(event.clientX, event.clientY);
    setSelected([]);
    setCreateMenu({ x: event.clientX - (rect?.left || 0), y: event.clientY - (rect?.top || 0), point });
  }

  function workflowDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const file = Array.from(event.dataTransfer.files || []).find((item) => item.name.toLowerCase().endsWith(".json"));
    if (!file) return;
    void importWorkflowPayloadFile(file);
  }

  async function importClipboardFiles(files: FileList | null) {
    const list = Array.from(files || []).filter((file) => /^(image|audio|video|text|application)\//.test(file.type));
    if (!list.length) return false;
    pushHistory();
    const point = lastMouseWorldRef.current;
    setStatus("pasting");
    try {
      for (const [index, file] of list.entries()) {
        const resp = await uploadAsset(file, "canvas,paste");
        addNode("image", { x: point.x + index * 28, y: point.y + index * 28 }, {
          name: resp.asset.name,
          asset_id: resp.asset.id,
          url: assetContentURL(resp.asset.id),
          media_type: mediaTypeForFile(file),
          mime_type: file.type
        }, false);
      }
      await loadAssets();
      setStatus("ready");
      return true;
    } catch (err) {
      setError(err);
      setStatus("failed");
      return true;
    }
  }

  useEffect(() => {
    void load();
    void loadAssets();
  }, [canvasId]);

  useEffect(() => {
    async function onPaste(event: ClipboardEvent) {
      if ((event.target as HTMLElement | null)?.closest("input,textarea,[contenteditable='true']")) return;
      const handled = await importClipboardFiles(event.clipboardData?.files || null);
      if (handled) event.preventDefault();
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [nodes, connections, viewport]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.target as HTMLElement | null)?.closest("input,textarea,[contenteditable='true']")) return;
      if (event.key.toLowerCase() === "r") rKeyRef.current = true;
      if (event.key === "Escape") {
        setCreateMenu(null);
        setLinkingFrom("");
        setAssetPanelOpen(false);
        setWorkflowOpen(false);
        setLogOpen(false);
        setShortcutOpen(false);
        setAssetManagerOpen(false);
        setPromptTemplateOpen(false);
        setPromptPresetOpen(false);
        setRunSettingsOpen(false);
        setNodeMenu(null);
        setOutputPreview(null);
        setImageEditor(null);
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
        event.preventDefault();
        copySelected();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
        event.preventDefault();
        pasteSelected();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "g") {
        event.preventDefault();
        if (event.shiftKey) ungroupSelected();
        else groupSelected();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void persist();
      }
      if (!event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setAssetPanelOpen((open) => !open);
      }
      if (!event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        setZoomPreview((value) => !value);
      }
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "r") rKeyRef.current = false;
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [selected, nodes, connections, viewport, canvas]);

  useEffect(() => {
    function onWindowPointerMove(event: globalThis.PointerEvent) {
      if (!dragRef.current) return;
      handlePointerMove(event);
    }

    function onWindowPointerUp(event: globalThis.PointerEvent) {
      if (!dragRef.current) return;
      handlePointerUp(event);
    }

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerUp);
    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerUp);
    };
  });

  const paths = connections
    .map((conn) => {
      const from = nodes.find((node) => node.id === conn.from);
      const to = nodes.find((node) => node.id === conn.to);
      if (!from || !to) return null;
      const a = nodeCenter(from, "right");
      const b = nodeCenter(to, "left");
      const mid = Math.max(40, Math.abs(b.x - a.x) / 2);
      return { conn, a, b, d: `M ${a.x} ${a.y} C ${a.x + mid} ${a.y}, ${b.x - mid} ${b.y}, ${b.x} ${b.y}` };
    })
    .filter(Boolean) as { conn: CanvasConnection; a: { x: number; y: number }; b: { x: number; y: number }; d: string }[];

  return (
    <section className="canvas-editor-page">
      <div className="canvas-editor-topbar">
        <button className="icon-button" type="button" onClick={() => navigate("/canvases")}>
          <ArrowLeft size={16} />
        </button>
        <div className="canvas-editor-title">
          <strong>{canvas?.title || "画布"}</strong>
          <span>{canvas?.kind || "classic"} · {status}</span>
        </div>
        <div className="canvas-editor-toolbar">
          <button className="button" type="button" onClick={() => setWorkflowOpen(true)}>
            <PackageOpen size={16} /> 工作流
          </button>
          <button className="button" type="button" onClick={() => setAssetPanelOpen(true)}>
            <Library size={16} /> 资产
          </button>
          <button className="button" type="button" onClick={() => setAssetManagerOpen(true)}>
            <Layers size={16} /> 管理
          </button>
          <button className="button" type="button" onClick={() => setPromptTemplateOpen(true)}>
            <TextCursorInput size={16} /> 模板
          </button>
          <button className="button" type="button" onClick={() => setRunSettingsOpen(true)}>
            <Settings2 size={16} /> 参数
          </button>
          <button className="button" type="button" onClick={() => setLogOpen(true)}>
            <ListTodo size={16} /> 日志
          </button>
          <button className="button" type="button" onClick={() => setShortcutOpen(true)}>
            <Keyboard size={16} /> 快捷键
          </button>
          <button className="icon-button" type="button" title="撤销" onClick={undo}>
            <Undo2 size={16} />
          </button>
          <button className="icon-button" type="button" title="重做" onClick={redo}>
            <Redo2 size={16} />
          </button>
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> 刷新
          </button>
          <button className="button" type="button" onClick={() => void persist()}>
            <Save size={16} /> 保存
          </button>
          <button className="button primary" type="button" onClick={() => void run()}>
            <Play size={16} /> 运行
          </button>
          <button className="button" type="button" disabled={selectedNodes.length !== 1} onClick={() => void runSelectedNode()}>
            <Play size={16} /> 运行节点
          </button>
        </div>
      </div>
      <ApiErrorView error={error} />
      {canvas?.kind === "smart" && (
        <div className="canvas-smart-composer">
          <div className="canvas-smart-composer-head">
            <select value={smartEngine} onChange={(event) => setSmartEngine(event.target.value)}>
              {ENGINES.map((engine) => (
                <option key={engine} value={engine}>
                  {engine}
                </option>
              ))}
            </select>
            <div className="canvas-segmented">
              <button className={smartKind === "image" ? "active" : ""} type="button" onClick={() => setSmartKind("image")}>
                图片
              </button>
              <button className={smartKind === "video" ? "active" : ""} type="button" onClick={() => setSmartKind("video")}>
                视频
              </button>
            </div>
          </div>
          <textarea
            value={smartPrompt}
            placeholder="描述你想生成或编辑的图片，可从模板库插入，也可引用画布中的媒体节点。"
            onChange={(event) => setSmartPrompt(event.target.value)}
          />
          <div className="canvas-smart-composer-actions">
            <button className="button" type="button" onClick={() => setPromptTemplateOpen(true)}>
              <Library size={16} /> 模板库
            </button>
            <button className="button" type="button" onClick={() => setPromptPresetOpen(true)}>
              <Pencil size={16} /> 预设
            </button>
            <button className="button" type="button" onClick={() => void runSmartComposer(true)}>
              <Workflow size={16} /> 一键运行
            </button>
            <button className="button primary" type="button" onClick={() => void runSmartComposer(false)}>
              <Sparkles size={16} /> 运行
            </button>
          </div>
        </div>
      )}
      <div
        ref={boardRef}
        className={`canvas-board ${zoomPreview ? "zoom-preview" : ""}`}
        onWheel={onWheel}
        onPointerDown={onBoardPointerDown}
        onDoubleClick={openCreateMenu}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={openCreateMenu}
        onDrop={(event) => void onDrop(event)}
        onDragOver={(event) => event.preventDefault()}
      >
        <div className="canvas-floating-toolbar">
          <button className="icon-button" type="button" title="Fit all" onClick={fitAllNodes}>
            <Expand size={15} />
          </button>
        </div>
        <div className="canvas-world" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}>
          <svg className="canvas-links">
            {paths.map(({ conn, d }) => (
              <g key={conn.id || `${conn.from}-${conn.to}`}>
                <path d={d} className={`canvas-link ${hoveredConnectionID === conn.id ? "hovered" : ""}`} />
                <path
                  d={d}
                  className="canvas-link-hit"
                  onPointerEnter={() => setHoveredConnectionID(conn.id || "")}
                  onPointerLeave={() => setHoveredConnectionID("")}
                  onClick={() => deleteConnection(conn.id)}
                />
              </g>
            ))}
            {knifeTrail.length > 1 && <polyline className="canvas-knife-trail" points={knifeTrail.map((point) => `${point.x},${point.y}`).join(" ")} />}
          </svg>
          <div className="canvas-link-controls">
            {paths.map(({ conn, a, b }) => (
              <button
                key={`${conn.id}-delete`}
                className={`canvas-link-delete ${hoveredConnectionID === conn.id ? "visible" : ""}`}
                style={{ left: (a.x + b.x) / 2, top: (a.y + b.y) / 2 }}
                type="button"
                title="删除连线"
                onPointerEnter={() => setHoveredConnectionID(conn.id || "")}
                onPointerLeave={() => setHoveredConnectionID("")}
                onClick={() => deleteConnection(conn.id)}
              >
                ×
              </button>
            ))}
          </div>
          {nodes.map((node) => {
            const size = nodeSize(node);
            return (
              <div
                key={node.id}
                data-node-id={node.id}
                className={`canvas-node canvas-node-${node.type} ${selectedSet.has(node.id) ? "selected" : ""}`}
                style={{ left: node.x, top: node.y, width: size.w, minHeight: size.h }}
                onPointerDown={(event) => onNodePointerDown(event, node)}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  openNodePreview(node);
                }}
                onContextMenu={(event) => openNodeContext(event, node)}
              >
                {node.type === "group" && Array.isArray(node.items) && (
                  <div className="canvas-group-count">{node.items.length} items</div>
                )}
                <div className="canvas-node-head">
                  <span>{nodeIcon(node.type)}</span>
                  <strong>{node.title || nodeTitle(node.type)}</strong>
                  <button className="canvas-port out" type="button" title="拖拽输出，或点击后再点输入" onPointerDown={(event) => startLink(event, node.id, "out")} />
                </div>
                <button className="canvas-port in" type="button" title="输入" onPointerDown={(event) => startLink(event, node.id, "in")} onClick={() => connect(node.id)} />
                <NodeBody
                  node={node}
                  onChange={(patch) => updateNode(node.id, patch)}
                  onTemplate={() => {
                    setSelected([node.id]);
                    setPromptTemplateOpen(true);
                  }}
                  onPreview={() => openNodePreview(node)}
                  onEdit={(mode) => {
                    setSelected([node.id]);
                    setImageEditor({ node, mode });
                  }}
                  onRun={() => void runNode(node)}
                />
                <button className="canvas-resize-handle" type="button" title="调整大小" onPointerDown={(event) => startResize(event, node)} />
              </div>
            );
          })}
          {linkingFrom && tempLinkPoint && (() => {
            const from = nodes.find((node) => node.id === linkingFrom);
            if (!from) return null;
            const a = nodeCenter(from, "right");
            const b = tempLinkPoint;
            const mid = Math.max(40, Math.abs(b.x - a.x) / 2);
            return <svg className="canvas-links"><path className="canvas-link pending" d={`M ${a.x} ${a.y} C ${a.x + mid} ${a.y}, ${b.x - mid} ${b.y}, ${b.x} ${b.y}`} /></svg>;
          })()}
          {selectionBox && (
            <div
              className="canvas-selection-box"
              style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }}
            />
          )}
        </div>
        <div className="canvas-minimap" onPointerDown={onMinimapPointerDown}>
          <div
            className="canvas-minimap-viewport"
            style={{
              left: `${((minimap.view.x - minimap.bounds.x) / minimap.bounds.w) * 100}%`,
              top: `${((minimap.view.y - minimap.bounds.y) / minimap.bounds.h) * 100}%`,
              width: `${(minimap.view.w / minimap.bounds.w) * 100}%`,
              height: `${(minimap.view.h / minimap.bounds.h) * 100}%`
            }}
          />
          {nodes.map((node) => (
            <span
              key={node.id}
              style={{
                left: `${((node.x - minimap.bounds.x) / minimap.bounds.w) * 100}%`,
                top: `${((node.y - minimap.bounds.y) / minimap.bounds.h) * 100}%`,
                width: `${Math.max(4, (nodeSize(node).w / minimap.bounds.w) * 100)}%`,
                height: `${Math.max(3, (nodeSize(node).h / minimap.bounds.h) * 100)}%`
              }}
            />
          ))}
        </div>
        <div className="canvas-hint">拖动空白处平移，滚轮缩放，Ctrl 拖拽框选，Delete 删除，Ctrl+S 保存。</div>
        {selectedBounds && (
          <div
            className="canvas-selection-hub"
            style={{
              left: selectedBounds.x * viewport.scale + viewport.x,
              top: selectedBounds.y * viewport.scale + viewport.y - 46
            }}
          >
            <span>{selected.length} selected</span>
            <button type="button" title="复制" onClick={copySelected}>
              <Copy size={14} />
            </button>
            <button type="button" title="分组" onClick={groupSelected}>
              <BoxSelect size={14} />
            </button>
            <button type="button" title="取消分组" onClick={ungroupSelected}>
              <Ungroup size={14} />
            </button>
            <button type="button" title="下载资产" onClick={() => void downloadSelectedAssets()}>
              <Download size={14} />
            </button>
            <button type="button" title="删除" onClick={deleteSelected}>
              <Trash2 size={14} />
            </button>
            {selectedNodes.some((node) => node.type === "output") && (
              <>
                <button type="button" title="输出转分组" onClick={() => convertOutput(false)}>
                  <GitBranch size={14} />
                </button>
                <button type="button" title="复制输出分组" onClick={() => convertOutput(true)}>
                  <Copy size={14} />
                </button>
              </>
            )}
            {selectedNodes.length === 1 && selectedNodes[0].asset_id && (
              <button type="button" title="注册输出" onClick={() => void registerSelectedOutput()}>
                <Sparkles size={14} />
              </button>
            )}
          </div>
        )}
        {createMenu && (
          <div
            className="canvas-create-menu"
            style={{ left: createMenu.x, top: createMenu.y }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {NODE_TYPES.map((type) => (
              <button key={type} type="button" onClick={(event) => addNodeFromCreateMenu(event, type, createMenu.point)}>
                {nodeIcon(type)}
                <span>{nodeTitle(type)}</span>
              </button>
            ))}
          </div>
        )}
        {linkMenu && (
          <div
            className="canvas-create-menu link-menu"
            style={{ left: linkMenu.x, top: linkMenu.y }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <strong>{linkMenu.originKind === "out" ? "添加下游" : "添加上游"}</strong>
            {linkCreateOptions(linkMenu.originId, linkMenu.originKind).map((type) => {
              const origin = nodes.find((node) => node.id === linkMenu.originId);
              if (!origin) return null;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    addLinkedNode(type, origin, linkMenu.originKind === "out" ? "downstream" : "upstream", linkMenu.point);
                  }}
                >
                  {nodeIcon(type)}
                  <span>{nodeTitle(type)}</span>
                </button>
              );
            })}
          </div>
        )}
        {nodeMenu && (
          <div className="canvas-node-menu" style={{ left: nodeMenu.x - (boardRef.current?.getBoundingClientRect().left || 0), top: nodeMenu.y - (boardRef.current?.getBoundingClientRect().top || 0) }}>
            <strong>{nodeMenu.node.title || nodeTitle(nodeMenu.node.type)}</strong>
            <button type="button" onClick={() => void runSelectedNode()}>
              <Play size={15} /> 运行节点
            </button>
            {(nodeMenu.kind === "image" || nodeMenu.node.asset_id || nodeMenu.node.url) && (
              <>
                <button type="button" onClick={() => openNodePreview(nodeMenu.node)}>
                  <Eye size={15} /> 预览
                </button>
                <button type="button" onClick={() => setImageEditor({ node: nodeMenu.node, mode: "crop" })}>
                  <Crop size={15} /> 编辑图片
                </button>
              </>
            )}
            {nodeMenu.kind === "output" && (
              <>
                <button type="button" onClick={() => setOutputPreview({ node: nodeMenu.node, index: 0 })}>
                  <Eye size={15} /> 查看输出
                </button>
                <button type="button" onClick={() => convertOutput(false)}>
                  <GitBranch size={15} /> 输出转输入分组
                </button>
                <button type="button" onClick={() => convertOutput(true)}>
                  <Copy size={15} /> 复制输出分组
                </button>
                <button type="button" onClick={() => void downloadSelectedAssets()}>
                  <Archive size={15} /> 批量下载
                </button>
              </>
            )}
            <div className="canvas-node-menu-grid">
              <span>快速创建下游</span>
              {(["generator", "video", "llm", "output"] as CanvasNodeType[]).map((type) => (
                <button key={type} type="button" title={nodeTitle(type)} onClick={() => addLinkedNode(type, nodeMenu.node, "downstream")}>
                  {nodeIcon(type)}
                </button>
              ))}
              <span>快速创建上游</span>
              {(["image", "prompt", "loop", "smart-prompt"] as CanvasNodeType[]).map((type) => (
                <button key={type} type="button" title={nodeTitle(type)} onClick={() => addLinkedNode(type, nodeMenu.node, "upstream")}>
                  {nodeIcon(type)}
                </button>
              ))}
            </div>
            <button type="button" onClick={copySelected}>
              <Copy size={15} /> 复制
            </button>
            <button type="button" onClick={deleteSelected}>
              <Trash2 size={15} /> 删除
            </button>
          </div>
        )}
      </div>
      {assetPanelOpen && (
        <aside className="canvas-side-panel">
          <PanelHead title="资产库" onClose={() => setAssetPanelOpen(false)} />
          <div className="canvas-asset-panel-body">
            <div className="canvas-tabs compact">
              <button className={assetTab === "image" ? "active" : ""} type="button" onClick={() => setAssetTab("image")}>图片资产</button>
              <button className={assetTab === "workflow" ? "active" : ""} type="button" onClick={() => setAssetTab("workflow")}>工作流</button>
            </div>
            <select className="canvas-asset-select" defaultValue="default">
              <option value="default">默认资产库</option>
              <option value="project">当前项目</option>
            </select>
            <div className="canvas-asset-category-row">
              <select className="canvas-asset-select" defaultValue="all">
                <option value="all">全部分类</option>
                <option value="uploads">上传</option>
                <option value="outputs">输出</option>
              </select>
              <button className="icon-button" type="button" title="新建分组"><FolderPlus size={16} /></button>
              <button className="icon-button" type="button" title="重命名分组"><Pencil size={16} /></button>
            </div>
            <div className="canvas-asset-drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => void onDrop(event)}>
              拖入图片、视频、音频或输出保存到当前分组
            </div>
            {assetTab === "workflow" ? (
              <div className="canvas-manager-empty">
                <Package size={26} />
                <strong>工作流资产</strong>
                <p>导入 JSON/package 后会追加到当前画布。</p>
                <button className="button primary" type="button" onClick={() => setWorkflowOpen(true)}>打开工作流面板</button>
              </div>
            ) : (
              <div className="canvas-asset-list">
                {assets.map((asset) => (
                  <button
                    type="button"
                    key={asset.id}
                    className="canvas-asset-item"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("application/json", JSON.stringify(asset))}
                    onClick={() =>
                      addNode("image", undefined, { name: asset.name, asset_id: asset.id, url: assetContentURL(asset.id), media_type: asset.media_type, mime_type: asset.mime_type })
                    }
                  >
                    <img src={assetThumbnailURL(asset.id)} alt={asset.name} />
                    <span>{asset.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
      {workflowOpen && (
        <aside className="canvas-side-panel workflow">
          <PanelHead title="工作流" onClose={() => setWorkflowOpen(false)} />
          <div className="canvas-workflow-actions">
            <p>导出当前选中的节点，或导入 JSON / package 工作流到当前画布。</p>
            <div className="canvas-workflow-drop" onClick={() => workflowInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={workflowDrop}>
              拖入 JSON 工作流，或点击选择文件
            </div>
            <button className="button" type="button" disabled={!selectedNodes.length} onClick={() => void exportWorkflowJSON()}>
              <Download size={16} /> 导出选中 JSON
            </button>
            <button className="button" type="button" disabled={!selectedNodes.length} onClick={() => void exportWorkflowPackageJSON()}>
              <Download size={16} /> 导出 Package
            </button>
            <button className="button primary" type="button" onClick={() => workflowInputRef.current?.click()}>
              <FileUp size={16} /> 导入 JSON
            </button>
            <input ref={workflowInputRef} hidden type="file" accept="application/json,.json" onChange={importWorkflowFile} />
          </div>
        </aside>
      )}
      {logOpen && (
        <aside className="canvas-side-panel">
          <PanelHead title="日志" onClose={() => setLogOpen(false)} />
          <pre className="canvas-log">{JSON.stringify(canvas?.logs || [], null, 2)}</pre>
        </aside>
      )}
      {shortcutOpen && (
        <aside className="canvas-side-panel shortcuts">
          <PanelHead title="快捷键" onClose={() => setShortcutOpen(false)} />
          <div className="canvas-shortcuts">
            <Shortcut keys="Ctrl + 拖拽" text="框选节点" />
            <Shortcut keys="Ctrl + G" text="把选中节点放入分组" />
            <Shortcut keys="Ctrl + Shift + G" text="取消选中分组" />
            <Shortcut keys="Ctrl + Z / Y" text="撤销 / 重做" />
            <Shortcut keys="Ctrl + C / V" text="复制 / 粘贴节点和内部连线" />
            <Shortcut keys="A" text="打开或关闭资产库" />
            <Shortcut keys="Z" text="缩放到全部节点" />
            <Shortcut keys="双击空白处" text="打开快捷创建菜单" />
            <Shortcut keys="滚轮" text="缩放画布" />
            <Shortcut keys="Del" text="删除选中节点" />
          </div>
        </aside>
      )}
      {assetManagerOpen && (
        <div className="canvas-modal-backdrop" onMouseDown={() => setAssetManagerOpen(false)}>
          <div className="canvas-manager-panel" onMouseDown={(event) => event.stopPropagation()}>
            <PanelHead title="资产库管理" onClose={() => setAssetManagerOpen(false)} />
            <div className="canvas-tabs">
              {(["assets", "workflows", "prompts"] as const).map((tab) => (
                <button key={tab} className={assetManagerTab === tab ? "active" : ""} type="button" onClick={() => setAssetManagerTab(tab)}>
                  {tab === "assets" ? "图片资产" : tab === "workflows" ? "工作流" : "提示词库"}
                </button>
              ))}
            </div>
            <div className="canvas-manager-body">
              {assetManagerTab === "assets" && (
                <div className="canvas-manager-grid">
                  {assets.map((asset) => (
                    <button key={asset.id} type="button" onClick={() => addNode("image", undefined, { name: asset.name, asset_id: asset.id, media_type: asset.media_type })}>
                      <img src={assetThumbnailURL(asset.id)} alt={asset.name} />
                      <span>{asset.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {assetManagerTab === "workflows" && (
                <div className="canvas-manager-empty">
                  <Workflow size={28} />
                  <strong>工作流资产</strong>
                  <p>支持 JSON/package 导入导出，后续可通过 Asset media type 统一管理。</p>
                  <button className="button primary" type="button" onClick={() => setWorkflowOpen(true)}>
                    打开工作流面板
                  </button>
                </div>
              )}
              {assetManagerTab === "prompts" && (
                <div className="canvas-template-list">
                  {PROMPT_TEMPLATES.map((template) => (
                    <button key={template.id} type="button" onClick={() => insertTemplateText(template.text)}>
                      <span>{template.category}</span>
                      <strong>{template.title}</strong>
                      <p>{template.text}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {promptTemplateOpen && (
        <aside className="canvas-side-panel template-panel">
          <PanelHead title="提示词模板库" onClose={() => setPromptTemplateOpen(false)} />
          <div className="canvas-template-panel-body">
            <label className="canvas-search">
              <Search size={15} />
              <input value={promptTemplateSearch} placeholder="搜索模板..." onChange={(event) => setPromptTemplateSearch(event.target.value)} />
            </label>
            <div className="canvas-template-cats">
              {templateCategories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>
            <div className="canvas-template-list">
              {filteredTemplates.map((template) => (
                <button key={template.id} type="button" onClick={() => insertTemplateText(template.text)}>
                  <span>{template.category}</span>
                  <strong>{template.title}</strong>
                  <p>{template.text}</p>
                </button>
              ))}
            </div>
            <button className="button" type="button" onClick={saveActivePromptAsPreset}>
              <Save size={16} /> 当前提示词存为预设
            </button>
          </div>
        </aside>
      )}
      {promptPresetOpen && (
        <aside className="canvas-side-panel preset-panel">
          <PanelHead title="提示词预设" onClose={() => setPromptPresetOpen(false)} />
          <div className="canvas-form-grid">
            <input value={promptPresetName} placeholder="预设名称" onChange={(event) => setPromptPresetName(event.target.value)} />
            <textarea value={promptPresetText} placeholder="预设内容" onChange={(event) => setPromptPresetText(event.target.value)} />
            <div className="canvas-form-row">
              <button className="button danger" type="button" onClick={() => setPromptPresetText("")}>
                删除
              </button>
              <button className="button primary" type="button" onClick={applyPromptPreset}>
                应用
              </button>
            </div>
          </div>
        </aside>
      )}
      {runSettingsOpen && (
        <aside className="canvas-side-panel settings-panel">
          <PanelHead title="生成参数" onClose={() => setRunSettingsOpen(false)} />
          <div className="canvas-form-grid">
            <label>Provider / Engine</label>
            <select value={String(canvas?.settings?.engine || smartEngine)} onChange={(event) => updateCanvasSetting("engine", event.target.value)}>
              {ENGINES.map((engine) => (
                <option key={engine} value={engine}>
                  {engine}
                </option>
              ))}
            </select>
            <label>Ratio</label>
            <select value={String(canvas?.settings?.ratio || "source")} onChange={(event) => updateCanvasSetting("ratio", event.target.value)}>
              {RATIOS.map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio}
                </option>
              ))}
            </select>
            <label>Resolution</label>
            <input value={String(canvas?.settings?.resolution || "1024x1024")} onChange={(event) => updateCanvasSetting("resolution", event.target.value)} />
            <label>Count</label>
            <input type="number" min={1} max={16} value={Number(canvas?.settings?.count || 1)} onChange={(event) => updateCanvasSetting("count", Number(event.target.value))} />
            <label>Quality</label>
            <select value={String(canvas?.settings?.quality || "standard")} onChange={(event) => updateCanvasSetting("quality", event.target.value)}>
              <option value="standard">standard</option>
              <option value="high">high</option>
              <option value="draft">draft</option>
            </select>
          </div>
        </aside>
      )}
      {outputPreview && (
        <OutputLightbox
          preview={outputPreview}
          compareEnabled={compareEnabled}
          comparePos={comparePos}
          onCompare={() => setCompareEnabled((value) => !value)}
          onComparePos={setComparePos}
          onClose={() => setOutputPreview(null)}
          onPrev={() => setOutputPreview((prev) => (prev ? { ...prev, index: Math.max(0, prev.index - 1) } : prev))}
          onNext={() =>
            setOutputPreview((prev) =>
              prev ? { ...prev, index: Math.min(Math.max(0, outputItems(prev.node).length - 1), prev.index + 1) } : prev
            )
          }
          onDownload={() => void downloadOutputAssets(outputPreview.node)}
          onRerun={() => void runSelectedNode()}
        />
      )}
      {imageEditor && (
        <ImageEditorModal
          state={imageEditor}
          brushTool={brushTool}
          gridRows={gridRows}
          gridCols={gridCols}
          gridGap={gridGap}
          setBrushTool={setBrushTool}
          setGridRows={setGridRows}
          setGridCols={setGridCols}
          setGridGap={setGridGap}
          onMode={(mode) => setImageEditor((prev) => (prev ? { ...prev, mode } : prev))}
          onClose={() => setImageEditor(null)}
          onApply={applyImageEdit}
          url={currentMediaURL(imageEditor.node) || currentThumbnailURL(imageEditor.node)}
        />
      )}
    </section>
  );
}

function PanelHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="canvas-panel-head">
      <strong>{title}</strong>
      <button className="icon-button" type="button" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

function Shortcut({ keys, text }: { keys: string; text: string }) {
  return (
    <div className="canvas-shortcut-item">
      <kbd>{keys}</kbd>
      <span>{text}</span>
    </div>
  );
}

function OutputLightbox({
  preview,
  compareEnabled,
  comparePos,
  onCompare,
  onComparePos,
  onClose,
  onPrev,
  onNext,
  onDownload,
  onRerun
}: {
  preview: OutputPreviewState;
  compareEnabled: boolean;
  comparePos: number;
  onCompare: () => void;
  onComparePos: (value: number) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDownload: () => void;
  onRerun: () => void;
}) {
  const items = outputItems(preview.node);
  const item = items[preview.index] || {};
  const url = String(item.asset_id ? assetContentURL(String(item.asset_id)) : item.url || preview.node.url || "");
  const mime = String(item.mime_type || item.media_type || "");
  return (
    <div className="canvas-modal-backdrop output" onMouseDown={onClose}>
      <div className="canvas-output-shell" onMouseDown={(event) => event.stopPropagation()}>
        <div className="canvas-output-preview">
          {mime.startsWith("video") || url.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
            <video src={url} controls playsInline />
          ) : (
            <div className="canvas-output-compare">
              <img src={url} alt="output" />
              {compareEnabled && (
                <div className="canvas-output-compare-layer" style={{ width: `${comparePos}%` }}>
                  <img src={String(item.source_url || url)} alt="source" />
                </div>
              )}
            </div>
          )}
          <button className="preview-nav-btn prev" type="button" onClick={onPrev}>
            <ChevronLeft size={18} />
          </button>
          <button className="preview-nav-btn next" type="button" onClick={onNext}>
            <ChevronRight size={18} />
          </button>
        </div>
        <aside className="canvas-output-side">
          <PanelHead title="输出预览" onClose={onClose} />
          <div className="canvas-form-grid">
            <div className="canvas-output-meta">
              <strong>{String(item.name || preview.node.name || "output")}</strong>
              <span>{preview.index + 1} / {Math.max(1, items.length)}</span>
            </div>
            <label>Compare</label>
            <input type="range" min={1} max={99} value={comparePos} onChange={(event) => onComparePos(Number(event.target.value))} />
            <button className="button" type="button" onClick={onCompare}>
              <Columns2 size={16} /> 对比原图
            </button>
            <button className="button" type="button" onClick={onDownload}>
              <Archive size={16} /> 下载全部
            </button>
            <button className="button primary" type="button" onClick={onRerun}>
              <RefreshCw size={16} /> 再次运行
            </button>
            <pre>{String(item.prompt || preview.node.prompt || preview.node.text || "")}</pre>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ImageEditorModal({
  state,
  brushTool,
  gridRows,
  gridCols,
  gridGap,
  setBrushTool,
  setGridRows,
  setGridCols,
  setGridGap,
  onMode,
  onClose,
  onApply,
  url
}: {
  state: ImageEditorState;
  brushTool: "free" | "rect" | "ellipse" | "label" | "text";
  gridRows: number;
  gridCols: number;
  gridGap: number;
  setBrushTool: (value: "free" | "rect" | "ellipse" | "label" | "text") => void;
  setGridRows: (value: number) => void;
  setGridCols: (value: number) => void;
  setGridGap: (value: number) => void;
  onMode: (mode: ImageEditMode) => void;
  onClose: () => void;
  onApply: () => void;
  url: string;
}) {
  const mediaType = String(state.node.media_type || state.node.mime_type || "");
  const isVideo = mediaType.startsWith("video") || url.match(/\.(mp4|webm|mov)(\?|$)/i);
  return (
    <div className="canvas-modal-backdrop" onMouseDown={onClose}>
      <div className="canvas-image-editor" onMouseDown={(event) => event.stopPropagation()}>
        <div className="canvas-image-editor-head">
          <div>
            <strong>编辑图片</strong>
            <span>{state.node.name || state.node.title || "media"}</span>
          </div>
          <div className="canvas-image-editor-modes">
            {(["preview", "crop", "outpaint", "mask", "brush", "grid"] as ImageEditMode[]).map((mode) => (
              <button key={mode} className={state.mode === mode ? "active" : ""} type="button" onClick={() => onMode(mode)}>
                {mode === "preview" ? <Eye size={15} /> : mode === "crop" ? <Crop size={15} /> : mode === "outpaint" ? <Expand size={15} /> : mode === "mask" ? <Brush size={15} /> : mode === "brush" ? <Paintbrush size={15} /> : <Grid3X3 size={15} />}
                {mode}
              </button>
            ))}
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="canvas-image-editor-tools">
          {state.mode === "preview" && (
            <>
              <button className="button" type="button">
                <Columns2 size={16} /> 对比原图
              </button>
              <button className="button" type="button">
                <ImageDown size={16} /> 导出画面
              </button>
              {isVideo && (
                <>
                  <button className="button" type="button">
                    <SkipBack size={16} /> 导出首帧
                  </button>
                  <button className="button" type="button">
                    <SkipForward size={16} /> 导出尾帧
                  </button>
                </>
              )}
            </>
          )}
          {state.mode === "mask" && (
            <>
              <label>笔刷 <input type="range" min={4} max={160} defaultValue={42} /></label>
              <button className="button" type="button"><Undo2 size={16} /> 撤销</button>
              <button className="button" type="button"><Redo2 size={16} /> 恢复</button>
              <button className="button" type="button"><Eraser size={16} /> 清空</button>
            </>
          )}
          {state.mode === "brush" && (
            <>
              {(["free", "rect", "ellipse", "label", "text"] as const).map((tool) => (
                <button key={tool} className={`button ${brushTool === tool ? "primary" : ""}`} type="button" onClick={() => setBrushTool(tool)}>
                  {tool === "rect" ? <Square size={16} /> : tool === "ellipse" ? <Circle size={16} /> : tool === "text" ? <Type size={16} /> : <Paintbrush size={16} />}
                  {tool}
                </button>
              ))}
              <input type="color" defaultValue="#ff2d55" />
              <label>笔刷 <input type="range" min={2} max={80} defaultValue={14} /></label>
            </>
          )}
          {state.mode === "grid" && (
            <>
              <button className="button" type="button" onClick={() => { setGridRows(1); setGridCols(2); }}>1x2</button>
              <button className="button" type="button" onClick={() => { setGridRows(2); setGridCols(1); }}>2x1</button>
              <button className="button" type="button" onClick={() => { setGridRows(2); setGridCols(2); }}>2x2</button>
              <label>横向线 <input type="number" min={0} max={20} value={gridRows} onChange={(event) => setGridRows(Number(event.target.value))} /></label>
              <label>竖向线 <input type="number" min={0} max={20} value={gridCols} onChange={(event) => setGridCols(Number(event.target.value))} /></label>
              <label>间隔 <input type="range" min={0} max={240} value={gridGap} onChange={(event) => setGridGap(Number(event.target.value))} /></label>
            </>
          )}
          {state.mode === "outpaint" && <span>拖动扩展边界后应用，后端将通过 Asset 派生任务记录结果。</span>}
        </div>
        <div className={`canvas-image-editor-stage mode-${state.mode}`}>
          {isVideo ? <video src={url} controls playsInline /> : <img src={url} alt={state.node.name || "edit"} />}
          {state.mode === "crop" && <div className="canvas-crop-box"><span /></div>}
          {state.mode === "outpaint" && <div className="canvas-outpaint-box"><span /><span /><span /><span /></div>}
          {state.mode === "mask" && <canvas className="canvas-edit-overlay" />}
          {state.mode === "brush" && <canvas className="canvas-edit-overlay brush" />}
          {state.mode === "grid" && (
            <div className="canvas-grid-overlay" style={{ gridTemplateColumns: `repeat(${Math.max(1, gridCols)}, 1fr)`, gridTemplateRows: `repeat(${Math.max(1, gridRows)}, 1fr)`, gap: gridGap }} />
          )}
        </div>
        <div className="canvas-image-editor-actions">
          <span>100%</span>
          <button className="button" type="button"><RotateCcw size={16} /> 重置</button>
          <button className="button" type="button" onClick={onClose}>取消</button>
          <button className="button primary" type="button" onClick={onApply}><Crop size={16} /> 应用</button>
        </div>
      </div>
    </div>
  );
}

function NodeBody({
  node,
  onChange,
  onTemplate,
  onPreview,
  onEdit,
  onRun
}: {
  node: CanvasNode;
  onChange: (patch: Partial<CanvasNode>) => void;
  onTemplate: () => void;
  onPreview: () => void;
  onEdit: (mode: ImageEditMode) => void;
  onRun: () => void;
}) {
  if (node.type === "image" || node.type === "smart-image") {
    const mediaType = String(node.media_type || node.mime_type || "");
    return (
      <div className="canvas-node-body">
        {mediaType.startsWith("audio") ? (
          <div className="canvas-node-audio">
            <strong>{node.name || "audio"}</strong>
            <audio src={node.asset_id ? assetContentURL(String(node.asset_id)) : String(node.url)} controls preload="metadata" />
          </div>
        ) : mediaType.startsWith("video") ? (
          <video className="canvas-node-image" src={node.asset_id ? assetContentURL(String(node.asset_id)) : String(node.url)} controls preload="metadata" />
        ) : mediaType.includes("json") || mediaType.includes("text") || mediaType.includes("markdown") ? (
          <iframe className="canvas-node-doc" src={node.asset_id ? assetContentURL(String(node.asset_id)) : String(node.url)} title={node.name || "document"} />
        ) : node.asset_id || node.url ? (
          <img className="canvas-node-image" src={node.asset_id ? assetThumbnailURL(String(node.asset_id)) : String(node.url)} alt={node.name || "asset"} />
        ) : (
          <div className="canvas-node-placeholder">拖入图片或从资产库选择</div>
        )}
        <input value={node.name || ""} placeholder="名称" onChange={(event) => onChange({ name: event.target.value })} />
        <div className="canvas-node-actions">
          <button type="button" onClick={onPreview}><Eye size={14} /> 预览</button>
          <button type="button" onClick={() => onEdit("crop")}><Crop size={14} /> 裁剪</button>
          <button type="button" onClick={() => onEdit("mask")}><Brush size={14} /> 遮罩</button>
          <button type="button" onClick={() => onEdit("grid")}><Grid3X3 size={14} /> 宫格</button>
        </div>
      </div>
    );
  }
  if (node.type === "prompt" || node.type === "llm" || node.type === "smart-prompt") {
    return (
      <div className="canvas-node-body">
        <div className="canvas-prompt-toolbar">
          <span>{String(node.text || "").length} / 20,000</span>
        </div>
        <textarea value={node.text || ""} placeholder="输入提示词..." onChange={(event) => onChange({ text: event.target.value })} />
        <div className="canvas-node-actions">
          <button type="button" onClick={onTemplate}><Library size={14} /> 模板</button>
          <button type="button" onClick={() => onChange({ text: `${String(node.text || "")}\n--style cinematic --quality high` })}>
            <Sparkles size={14} /> 预设
          </button>
        </div>
        {node.type === "llm" && (
          <div className="canvas-node-subpanel">
            <label>Chat input</label>
            <textarea value={String(node.chatInput || "")} placeholder="输入对话消息..." onChange={(event) => onChange({ chatInput: event.target.value })} />
            <label>System prompt</label>
            <input value={String(node.systemPrompt || "")} onChange={(event) => onChange({ systemPrompt: event.target.value })} />
          </div>
        )}
      </div>
    );
  }
  if (node.type === "loop" || node.type === "smart-loop") {
    return (
      <div className="canvas-node-body compact">
        <label>次数</label>
        <input type="number" min={1} max={99} value={Number(node.count || 3)} onChange={(event) => onChange({ count: Number(event.target.value) })} />
        <label>模式</label>
        <select value={String(node.mode || "serial")} onChange={(event) => onChange({ mode: event.target.value })}>
          <option value="serial">serial</option>
          <option value="batch">batch</option>
          <option value="cascade">cascade</option>
        </select>
        <label>变量</label>
        <textarea value={String(node.variables || "")} placeholder="每行一个变量，运行时按轮次注入" onChange={(event) => onChange({ variables: event.target.value })} />
        <label className="canvas-check"><input type="checkbox" checked={Boolean(node.showPrompt)} onChange={(event) => onChange({ showPrompt: event.target.checked })} /> 展示提示词</label>
        <label className="canvas-check"><input type="checkbox" checked={Boolean(node.imageInput)} onChange={(event) => onChange({ imageInput: event.target.checked })} /> 图片输入</label>
      </div>
    );
  }
  if (["generator", "msgen", "video"].includes(String(node.type))) {
    return (
      <div className="canvas-node-body compact">
        <label>Provider</label>
        <select value={String(node.provider || (node.type === "msgen" ? "modelscope" : "api"))} onChange={(event) => onChange({ provider: event.target.value })}>
          <option value="api">api</option>
          <option value="volcengine">volcengine</option>
          <option value="modelscope">modelscope</option>
          <option value="deepseek">deepseek</option>
        </select>
        <label>Model</label>
        <input value={node.model || ""} placeholder="model" onChange={(event) => onChange({ model: event.target.value })} />
        <label>Ratio / Resolution</label>
        <div className="canvas-node-row">
          <select value={String(node.ratio || "source")} onChange={(event) => onChange({ ratio: event.target.value })}>
            {RATIOS.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
          </select>
          <input value={String(node.resolution || "1024x1024")} onChange={(event) => onChange({ resolution: event.target.value })} />
        </div>
        <label>Count / Quality</label>
        <div className="canvas-node-row">
          <input type="number" min={1} max={16} value={Number(node.count || 1)} onChange={(event) => onChange({ count: Number(event.target.value) })} />
          <select value={String(node.quality || "standard")} onChange={(event) => onChange({ quality: event.target.value })}>
            <option value="draft">draft</option>
            <option value="standard">standard</option>
            <option value="high">high</option>
          </select>
        </div>
        {node.type === "video" && (
          <>
            <label>Duration / FPS</label>
            <div className="canvas-node-row">
              <input type="number" min={1} max={30} value={Number(node.duration || 5)} onChange={(event) => onChange({ duration: Number(event.target.value) })} />
              <input type="number" min={1} max={60} value={Number(node.fps || 24)} onChange={(event) => onChange({ fps: Number(event.target.value) })} />
            </div>
          </>
        )}
        <div className="canvas-node-actions">
          <button type="button" onClick={onRun}><Play size={14} /> 运行</button>
          <button type="button" onClick={onRun}><Workflow size={14} /> 级联</button>
        </div>
      </div>
    );
  }
  if (node.type === "rh" || node.type === "comfy") {
    return (
      <div className="canvas-node-body compact">
        <label>{node.type === "rh" ? "RunningHub workflow/app" : "Comfy workflow"}</label>
        <input value={String(node.workflowId || node.workflow || "")} placeholder="workflow id / name" onChange={(event) => onChange({ workflowId: event.target.value })} />
        <label>Inputs</label>
        <textarea value={String(node.inputsText || "")} placeholder="prompt/image/video/audio field mapping" onChange={(event) => onChange({ inputsText: event.target.value })} />
        <label>Params JSON</label>
        <textarea value={String(node.paramsText || "{}")} onChange={(event) => onChange({ paramsText: event.target.value })} />
        <label className="canvas-check"><input type="checkbox" checked={Boolean(node.randomSeed)} onChange={(event) => onChange({ randomSeed: event.target.checked })} /> 随机 seed</label>
        <div className="canvas-node-actions">
          <button type="button" onClick={onRun}><Play size={14} /> 运行</button>
          <button type="button" onClick={onRun}><Workflow size={14} /> 级联</button>
        </div>
      </div>
    );
  }
  if (node.type === "ltxDirector") {
    return (
      <div className="canvas-node-body compact">
        <label>Global prompt</label>
        <textarea value={String(node.globalPrompt || "")} onChange={(event) => onChange({ globalPrompt: event.target.value })} />
        <label>Timeline segments</label>
        <textarea value={String(node.timelineText || "0-5s: scene description")} onChange={(event) => onChange({ timelineText: event.target.value })} />
        <label>Frame rate</label>
        <input type="number" min={1} max={60} value={Number(node.frameRate || 24)} onChange={(event) => onChange({ frameRate: Number(event.target.value) })} />
        <div className="canvas-node-actions">
          <button type="button" onClick={onRun}><Play size={14} /> 运行</button>
          <button type="button" onClick={() => onChange({ timeline_exported_at: new Date().toISOString() })}><Download size={14} /> 导出时间线</button>
        </div>
      </div>
    );
  }
  if (["output", "group", "promptGroup", "smart-group"].includes(String(node.type))) {
    return (
      <div className="canvas-node-body compact">
        <input value={node.model || ""} placeholder="model / output name" onChange={(event) => onChange({ model: event.target.value })} />
        {String(node.type).includes("group") ? (
          <div className="canvas-node-subpanel">
            <p>用于组织节点，支持工作流导入导出、释放分组、复制分组和拖入媒体。</p>
            <label>成员</label>
            <textarea value={Array.isArray(node.items) ? node.items.map(String).join("\n") : ""} onChange={(event) => onChange({ items: event.target.value.split("\n").filter(Boolean) })} />
          </div>
        ) : node.type === "output" ? (
          <p>{outputItems(node).length ? `${outputItems(node).length} 个输出。可预览、转为输入分组或下载资产。` : "等待生成结果注册为 Asset。"}</p>
        ) : (
          <p>执行统一创建 Provider/Task，由 worker 处理真实生成。</p>
        )}
        {node.type === "output" && (
          <textarea
            value={JSON.stringify(node.images || [], null, 2)}
            placeholder={'输出资产 JSON，如 [{"asset_id":"..."}]'}
            onChange={(event) => {
              try {
                onChange({ images: JSON.parse(event.target.value) });
              } catch {
                onChange({ output_text: event.target.value });
              }
            }}
          />
        )}
      </div>
    );
  }
  return null;
}
