// src/app/admin/models/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import AdminHeader from "../../../components/admin/AdminHeader";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Brain,
  RefreshCw,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Database,
  Search,
  CircleDot,
  FileCode2,
  Hash,
  XCircle,
  Layers,
  Activity,
  Cpu,
  Zap,
  ArrowRight,
  Shield,
  Settings2,
} from "lucide-react";
import {
  DEFAULT_PROCESSES,
  AVAILABLE_MODELS,
  type SystemModelConfig,
} from "../../../lib/model-config";
import {
  getSystemModelConfig,
  updateProcessModel,
  resetToDefaults,
} from "../../../actions/model-config-actions";
import { useAuth } from "../../../hooks/use-auth";

type CategoryType = "generation" | "embedding" | "image" | "retrieval";

const CATEGORY_CONFIG: Record<
  CategoryType,
  {
    label: string;
    icon: typeof Brain;
    color: string;
    iconBg: string;
    borderAccent: string;
    bgColor: string;
    description: string;
  }
> = {
  generation: {
    label: "Text Generation",
    icon: Sparkles,
    color: "text-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    borderAccent: "border-l-blue-500",
    bgColor: "bg-blue-500/5 border-blue-200/60",
    description:
      "Large language models powering content creation, analysis, and conversational AI",
  },
  retrieval: {
    label: "Retrieval & Search",
    icon: Search,
    color: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    borderAccent: "border-l-emerald-500",
    bgColor: "bg-emerald-500/5 border-emerald-200/60",
    description:
      "Models optimized for document retrieval, semantic search, and knowledge base queries",
  },
  image: {
    label: "Image Generation",
    icon: ImageIcon,
    color: "text-purple-600",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    borderAccent: "border-l-purple-500",
    bgColor: "bg-purple-500/5 border-purple-200/60",
    description: "Visual AI models for creating and editing images",
  },
  embedding: {
    label: "Embeddings",
    icon: Database,
    color: "text-orange-600",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    borderAccent: "border-l-orange-500",
    bgColor: "bg-orange-500/5 border-orange-200/60",
    description:
      "Vector embedding models for semantic similarity and search indexing",
  },
};

const PROVIDER_COLORS: Record<
  string,
  {
    badge: string;
    dot: string;
    bar: string;
    card: string;
    cardBorder: string;
    text: string;
    iconBg: string;
    ringColor: string;
  }
> = {
  Google: {
    badge: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200/80",
    dot: "bg-blue-500",
    bar: "bg-gradient-to-r from-blue-500 to-blue-400",
    card: "bg-gradient-to-br from-blue-50 via-white to-blue-50/40",
    cardBorder: "border-blue-200/70 hover:border-blue-300",
    text: "text-blue-700",
    iconBg: "bg-blue-100",
    ringColor: "ring-blue-200",
  },
  Anthropic: {
    badge: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200/80",
    dot: "bg-amber-500",
    bar: "bg-gradient-to-r from-amber-500 to-amber-400",
    card: "bg-gradient-to-br from-amber-50 via-white to-amber-50/40",
    cardBorder: "border-amber-200/70 hover:border-amber-300",
    text: "text-amber-700",
    iconBg: "bg-amber-100",
    ringColor: "ring-amber-200",
  },
  OpenAI: {
    badge: "bg-green-50 text-green-700 hover:bg-green-100 border-green-200/80",
    dot: "bg-green-500",
    bar: "bg-gradient-to-r from-green-500 to-green-400",
    card: "bg-gradient-to-br from-green-50 via-white to-green-50/40",
    cardBorder: "border-green-200/70 hover:border-green-300",
    text: "text-green-700",
    iconBg: "bg-green-100",
    ringColor: "ring-green-200",
  },
};

const PROVIDER_ICONS: Record<string, typeof Brain> = {
  Google: Cpu,
  Anthropic: Shield,
  OpenAI: Zap,
};

// Build flat list of all available models for select dropdown
const ALL_MODELS = Object.entries(AVAILABLE_MODELS).flatMap(
  ([provider, models]) => models.map((m) => ({ ...m, provider }))
);

interface PendingChange {
  model: string;
  provider: string;
}

export default function AdminModelPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<SystemModelConfig>({});
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, PendingChange>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{
    processId: string;
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSystemModelConfig();
      setConfig(data);
    } catch {
      console.error("Failed to load model config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const getCurrentModel = (processId: string, defaultModel: string) => {
    if (pendingChanges[processId]) return pendingChanges[processId].model;
    return config[processId]?.model || defaultModel;
  };

  const getCurrentProvider = (processId: string, defaultProvider: string) => {
    if (pendingChanges[processId]) return pendingChanges[processId].provider;
    return config[processId]?.provider || defaultProvider;
  };

  const handleModelChange = (processId: string, modelValue: string) => {
    const modelInfo = ALL_MODELS.find((m) => m.value === modelValue);
    if (!modelInfo) return;

    const proc = DEFAULT_PROCESSES.find((p) => p.processId === processId);
    const currentSaved = config[processId]?.model || proc?.currentModel;

    if (modelValue === currentSaved) {
      // Remove pending change if reverting to saved value
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[processId];
        return next;
      });
    } else {
      setPendingChanges((prev) => ({
        ...prev,
        [processId]: { model: modelValue, provider: modelInfo.provider },
      }));
    }
  };

  const handleSave = async (processId: string) => {
    const change = pendingChanges[processId];
    if (!change || !user?.uid) return;

    setSaving(processId);
    try {
      const result = await updateProcessModel(
        processId,
        change.model,
        change.provider,
        user.uid
      );
      if (result.success) {
        setConfig((prev) => ({
          ...prev,
          [processId]: {
            model: change.model,
            provider: change.provider,
            updatedAt: new Date().toISOString(),
            updatedBy: user.uid,
          },
        }));
        setPendingChanges((prev) => {
          const next = { ...prev };
          delete next[processId];
          return next;
        });
        setFeedback({ processId, type: "success", message: "Model updated" });
      } else {
        setFeedback({ processId, type: "error", message: result.message });
      }
    } catch {
      setFeedback({ processId, type: "error", message: "Failed to save" });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    if (!user?.uid) return;
    const entries = Object.entries(pendingChanges);
    if (entries.length === 0) return;

    setSaving("all");
    let allSuccess = true;
    for (const [processId, change] of entries) {
      const result = await updateProcessModel(
        processId,
        change.model,
        change.provider,
        user.uid
      );
      if (result.success) {
        setConfig((prev) => ({
          ...prev,
          [processId]: {
            model: change.model,
            provider: change.provider,
            updatedAt: new Date().toISOString(),
            updatedBy: user.uid,
          },
        }));
      } else {
        allSuccess = false;
      }
    }
    setPendingChanges({});
    setSaving(null);
    setFeedback({
      processId: "all",
      type: allSuccess ? "success" : "error",
      message: allSuccess ? "All models updated" : "Some updates failed",
    });
  };

  const handleReset = async () => {
    if (!user?.uid) return;
    setResetting(true);
    try {
      const result = await resetToDefaults(user.uid);
      if (result.success) {
        setPendingChanges({});
        await loadConfig();
        setFeedback({
          processId: "all",
          type: "success",
          message: "Reset to defaults",
        });
      } else {
        setFeedback({ processId: "all", type: "error", message: result.message });
      }
    } catch {
      setFeedback({
        processId: "all",
        type: "error",
        message: "Failed to reset",
      });
    } finally {
      setResetting(false);
    }
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;
  const pendingCount = Object.keys(pendingChanges).length;

  // Group processes by category
  const grouped = DEFAULT_PROCESSES.reduce<
    Record<CategoryType, typeof DEFAULT_PROCESSES>
  >(
    (acc, proc) => {
      acc[proc.category].push(proc);
      return acc;
    },
    { generation: [], retrieval: [], image: [], embedding: [] }
  );

  // Compute provider stats
  const providerStats = (["Google", "Anthropic", "OpenAI"] as const)
    .map((provider) => {
      const processes = DEFAULT_PROCESSES.filter(
        (p) => getCurrentProvider(p.processId, p.provider) === provider
      );
      // Find the most-used model for this provider
      const modelCounts: Record<string, number> = {};
      processes.forEach((p) => {
        const model = getCurrentModel(p.processId, p.currentModel);
        modelCounts[model] = (modelCounts[model] || 0) + 1;
      });
      const dominantModel = Object.entries(modelCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];
      return {
        provider,
        count: processes.length,
        dominantModel: dominantModel
          ? ALL_MODELS.find((m) => m.value === dominantModel[0])?.label ||
            dominantModel[0]
          : null,
        percentage:
          processes.length > 0
            ? Math.round((processes.length / DEFAULT_PROCESSES.length) * 100)
            : 0,
      };
    })
    .filter((s) => s.count > 0);

  return (
    <>
      <AdminHeader
        title="AI Models"
        subtitle="View and manage AI model assignments across all system processes."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={resetting || saving !== null}
            >
              {resetting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span className="hidden md:inline ml-1">Reset Defaults</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadConfig}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden md:inline ml-1">Refresh</span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 overflow-auto p-6 pb-28">
        {/* Global feedback banner */}
        {feedback?.processId === "all" && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-5 py-4 text-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm ${
              feedback.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <div>
              <p className="font-medium">{feedback.message}</p>
              <p className="text-xs opacity-75 mt-0.5">
                {feedback.type === "success"
                  ? "All changes have been applied across services"
                  : "Please try again or contact support"}
              </p>
            </div>
          </div>
        )}

        {/* ── Hero Section ────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-start gap-5 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-200/50">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">
                AI Model Registry
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
                Central configuration hub for all AI model assignments. Each
                process in the system is mapped to a specific model and
                provider. Changes take effect immediately across all services.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Activity className="w-3.5 h-3.5" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {DEFAULT_PROCESSES.length}
                    </span>{" "}
                    active processes
                  </span>
                </div>
                <span className="text-muted-foreground/30">|</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {providerStats.length}
                    </span>{" "}
                    providers
                  </span>
                </div>
                <span className="text-muted-foreground/30">|</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Brain className="w-3.5 h-3.5" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {Object.values(AVAILABLE_MODELS).flat().length}
                    </span>{" "}
                    available models
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Provider distribution bar */}
          <div className="rounded-xl border bg-card/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Provider Distribution
              </span>
              <div className="flex items-center gap-4">
                {providerStats.map((stat) => (
                  <div
                    key={stat.provider}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-sm ${PROVIDER_COLORS[stat.provider].dot}`}
                    />
                    <span className="font-medium">{stat.provider}</span>
                    <span className="text-muted-foreground/60">
                      {stat.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-muted/40 overflow-hidden flex gap-0.5">
              {providerStats.map((stat) => (
                <div
                  key={stat.provider}
                  className={`h-full ${PROVIDER_COLORS[stat.provider].bar} transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${stat.percentage}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats Cards Row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {providerStats.map((stat) => {
            const ProvIcon = PROVIDER_ICONS[stat.provider] || Brain;
            const colors = PROVIDER_COLORS[stat.provider];
            return (
              <Card
                key={stat.provider}
                className={`transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${colors.card} ${colors.cardBorder}`}
              >
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl ${colors.iconBg} transition-transform group-hover:scale-110`}
                    >
                      <ProvIcon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-normal max-w-[130px] truncate ${colors.badge}`}
                    >
                      {stat.dominantModel}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold tracking-tight">
                        {stat.count}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        process{stat.count !== 1 ? "es" : ""}
                      </p>
                    </div>
                    <p className={`text-sm font-semibold mt-0.5 ${colors.text}`}>
                      {stat.provider}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Total card */}
          <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-50/40">
            <CardContent className="pt-5 pb-5 px-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-100">
                  <Brain className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Activity className="w-3 h-3" />
                  All Active
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold tracking-tight">
                    {DEFAULT_PROCESSES.length}
                  </p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
                <p className="text-sm font-semibold mt-0.5 text-slate-600">
                  AI Processes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Category Sections ───────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="p-4 rounded-2xl bg-muted/30 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Loading model configuration
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Fetching assignments from the registry...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {(
              Object.entries(grouped) as [
                CategoryType,
                typeof DEFAULT_PROCESSES,
              ][]
            ).map(([category, processes]) => {
              if (processes.length === 0) return null;
              const catConfig = CATEGORY_CONFIG[category];
              const CatIcon = catConfig.icon;
              const pendingInCategory = processes.filter(
                (p) => !!pendingChanges[p.processId]
              ).length;

              return (
                <section key={category}>
                  {/* Section header */}
                  <div
                    className={`flex items-start gap-4 mb-5 p-4 rounded-xl border ${catConfig.bgColor}`}
                  >
                    <div
                      className={`p-2.5 rounded-xl ${catConfig.iconBg} shrink-0`}
                    >
                      <CatIcon className={`w-5 h-5 ${catConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg font-bold tracking-tight">
                          {catConfig.label}
                        </h2>
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold"
                        >
                          {processes.length}{" "}
                          {processes.length === 1 ? "process" : "processes"}
                        </Badge>
                        {pendingInCategory > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs animate-pulse"
                          >
                            <CircleDot className="w-3 h-3 mr-1" />
                            {pendingInCategory} unsaved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {catConfig.description}
                      </p>
                    </div>
                  </div>

                  {/* Process cards */}
                  <div className="grid gap-3 ml-1">
                    {processes.map((proc) => {
                      const currentModel = getCurrentModel(
                        proc.processId,
                        proc.currentModel
                      );
                      const currentProvider = getCurrentProvider(
                        proc.processId,
                        proc.provider
                      );
                      const isPending = !!pendingChanges[proc.processId];
                      const isSaving = saving === proc.processId;
                      const showFeedback =
                        feedback?.processId === proc.processId;
                      const providerColor = PROVIDER_COLORS[currentProvider];

                      return (
                        <Card
                          key={proc.processId}
                          className={`group relative transition-all duration-300 hover:shadow-md border-l-[3px] ${catConfig.borderAccent} ${
                            isPending
                              ? "ring-2 ring-yellow-300/60 border-l-yellow-400 shadow-md shadow-yellow-50"
                              : "hover:border-l-4"
                          } ${
                            showFeedback && feedback?.type === "success"
                              ? "ring-2 ring-green-300/60 border-l-green-400"
                              : ""
                          } ${
                            showFeedback && feedback?.type === "error"
                              ? "ring-2 ring-red-300/60 border-l-red-400"
                              : ""
                          }`}
                        >
                          <CardContent className="py-4 px-5">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                              {/* Left side: Process info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-medium text-sm leading-none">
                                    {proc.label}
                                  </h3>
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-semibold tracking-wide uppercase">
                                      <CircleDot className="w-2.5 h-2.5" />
                                      Modified
                                    </span>
                                  )}
                                  {showFeedback && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase transition-all animate-in fade-in zoom-in-95 duration-200 ${
                                        feedback?.type === "success"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {feedback?.type === "success" ? (
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                      ) : (
                                        <AlertCircle className="w-2.5 h-2.5" />
                                      )}
                                      {feedback?.message}
                                    </span>
                                  )}
                                </div>

                                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                                  {proc.description}
                                </p>

                                <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                                  {/* Used in pills */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mr-0.5">
                                      Used in
                                    </span>
                                    {proc.usedIn
                                      .split(",")
                                      .map((usage, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-[10px] text-muted-foreground font-medium border border-transparent hover:border-muted-foreground/10 transition-colors"
                                        >
                                          <Hash className="w-2.5 h-2.5 opacity-40" />
                                          {usage.trim()}
                                        </span>
                                      ))}
                                  </div>

                                  <span className="text-muted-foreground/20 hidden sm:inline">
                                    |
                                  </span>

                                  {/* Source file badge */}
                                  <div className="flex items-center gap-1.5">
                                    <FileCode2 className="w-3 h-3 text-muted-foreground/40" />
                                    <code className="text-[10px] text-muted-foreground/70 bg-muted/40 px-2 py-0.5 rounded-md font-mono border border-muted/60">
                                      {proc.sourceFile}
                                    </code>
                                  </div>
                                </div>
                              </div>

                              {/* Subtle vertical divider for large screens */}
                              <div className="hidden lg:block w-px h-12 bg-border/50 mx-1" />

                              {/* Right side: Model selector + provider badge */}
                              <div className="flex items-center gap-2.5 lg:min-w-[400px] shrink-0">
                                <Badge
                                  variant="outline"
                                  className={`shrink-0 text-xs py-1 px-2.5 ${providerColor?.badge || ""}`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${providerColor?.dot || "bg-gray-400"} mr-1.5`}
                                  />
                                  {currentProvider}
                                </Badge>

                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 hidden lg:block" />

                                <Select
                                  value={currentModel}
                                  onValueChange={(val) =>
                                    handleModelChange(proc.processId, val)
                                  }
                                >
                                  <SelectTrigger className="w-full text-sm h-9 bg-background/80 hover:bg-background transition-colors">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(AVAILABLE_MODELS).map(
                                      ([provider, models]) => (
                                        <SelectGroup key={provider}>
                                          <SelectLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                            <span
                                              className={`w-2 h-2 rounded-full ${PROVIDER_COLORS[provider]?.dot || "bg-gray-400"}`}
                                            />
                                            {provider}
                                          </SelectLabel>
                                          {models.map((m) => (
                                            <SelectItem
                                              key={m.value}
                                              value={m.value}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${PROVIDER_COLORS[provider]?.dot || "bg-gray-400"}`}
                                                />
                                                <span className="font-medium">
                                                  {m.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground hidden md:inline">
                                                  - {m.capability}
                                                </span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>

                                {isPending && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSave(proc.processId)}
                                    disabled={isSaving}
                                    className="shrink-0 h-9 px-4 transition-all animate-in fade-in zoom-in-95 duration-200 shadow-sm"
                                  >
                                    {isSaving ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                    <span className="ml-1.5 text-xs font-medium hidden sm:inline">
                                      Save
                                    </span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Sticky Action Bar ─────────────────────────────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          hasPendingChanges
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-screen-2xl px-6 pb-5">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-yellow-200/80 bg-white/95 backdrop-blur-lg shadow-xl shadow-yellow-200/30 px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-2 rounded-xl bg-yellow-100 animate-pulse">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[9px] font-bold text-white">
                  {pendingCount}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {pendingCount} unsaved change
                  {pendingCount !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Changes will take effect immediately once saved
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingChanges({})}
                disabled={saving !== null}
                className="text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Discard All
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={saving !== null}
                className="px-5 shadow-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all"
              >
                {saving === "all" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save All Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
