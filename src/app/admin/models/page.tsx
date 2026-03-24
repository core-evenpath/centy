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
    bgColor: string;
    description: string;
  }
> = {
  generation: {
    label: "Text Generation",
    icon: Sparkles,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10 border-blue-200",
    description:
      "Large language models powering content creation, analysis, and conversational AI",
  },
  retrieval: {
    label: "Retrieval & Search",
    icon: Search,
    color: "text-green-600",
    bgColor: "bg-green-500/10 border-green-200",
    description:
      "Models optimized for document retrieval, semantic search, and knowledge base queries",
  },
  image: {
    label: "Image Generation",
    icon: ImageIcon,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10 border-purple-200",
    description: "Visual AI models for creating and editing images",
  },
  embedding: {
    label: "Embeddings",
    icon: Database,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10 border-orange-200",
    description:
      "Vector embedding models for semantic similarity and search indexing",
  },
};

const PROVIDER_COLORS: Record<
  string,
  { badge: string; dot: string; bar: string; card: string; text: string }
> = {
  Google: {
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    card: "border-blue-200 bg-gradient-to-br from-blue-50/80 to-blue-50/30",
    text: "text-blue-700",
  },
  Anthropic: {
    badge: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    card: "border-amber-200 bg-gradient-to-br from-amber-50/80 to-amber-50/30",
    text: "text-amber-700",
  },
  OpenAI: {
    badge: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
    dot: "bg-green-500",
    bar: "bg-green-500",
    card: "border-green-200 bg-gradient-to-br from-green-50/80 to-green-50/30",
    text: "text-green-700",
  },
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
  const providerStats = (["Google", "Anthropic", "OpenAI"] as const).map(
    (provider) => {
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
    }
  ).filter((s) => s.count > 0);

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

      <main className="flex-1 overflow-auto p-6 pb-24">
        {/* Global feedback banner */}
        {feedback?.processId === "all" && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
              feedback.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {feedback.message}
          </div>
        )}

        {/* ── Hero Section ────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-200/50">
              <Layers className="w-7 h-7 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                AI Model Registry
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Central configuration for all AI model assignments. Each process
                in the system is mapped to a specific model and provider. Changes
                take effect immediately across all services.
              </p>
            </div>
          </div>

          {/* Provider distribution bar */}
          <div className="mt-5">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Provider Distribution
              </span>
              <div className="flex items-center gap-3 ml-auto">
                {providerStats.map((stat) => (
                  <div
                    key={stat.provider}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${PROVIDER_COLORS[stat.provider].dot}`}
                    />
                    <span>
                      {stat.provider}{" "}
                      <span className="font-medium">{stat.percentage}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted/50 overflow-hidden flex">
              {providerStats.map((stat) => (
                <div
                  key={stat.provider}
                  className={`h-full ${PROVIDER_COLORS[stat.provider].bar} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${stat.percentage}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats Cards Row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {providerStats.map((stat) => (
            <Card
              key={stat.provider}
              className={`transition-all hover:shadow-md ${PROVIDER_COLORS[stat.provider].card}`}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${PROVIDER_COLORS[stat.provider].dot}`}
                      />
                      <p
                        className={`text-sm font-semibold ${PROVIDER_COLORS[stat.provider].text}`}
                      >
                        {stat.provider}
                      </p>
                    </div>
                    <p className="text-3xl font-bold tracking-tight">
                      {stat.count}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      process{stat.count !== 1 ? "es" : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-normal max-w-[120px] truncate ${PROVIDER_COLORS[stat.provider].badge}`}
                  >
                    {stat.dominantModel}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="transition-all hover:shadow-md border-muted bg-gradient-to-br from-slate-50/80 to-slate-50/30">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-muted-foreground">
                      Total
                    </p>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">
                    {DEFAULT_PROCESSES.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    AI processes
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <Brain className="w-6 h-6 text-muted-foreground/40" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Category Sections ───────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading model configuration...
            </p>
          </div>
        ) : (
          <div className="space-y-10">
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
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`p-2 rounded-lg border ${catConfig.bgColor} shrink-0`}
                    >
                      <CatIcon className={`w-5 h-5 ${catConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-lg font-semibold">
                          {catConfig.label}
                        </h2>
                        <Badge variant="secondary" className="text-xs">
                          {processes.length}
                        </Badge>
                        {pendingInCategory > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs"
                          >
                            {pendingInCategory} unsaved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {catConfig.description}
                      </p>
                    </div>
                  </div>

                  {/* Process cards */}
                  <div className="grid gap-3">
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
                          className={`group transition-all duration-300 hover:shadow-sm ${
                            isPending
                              ? "ring-2 ring-yellow-300/70 border-yellow-300 shadow-sm shadow-yellow-100"
                              : ""
                          } ${
                            showFeedback && feedback?.type === "success"
                              ? "ring-2 ring-green-300 border-green-300"
                              : ""
                          } ${
                            showFeedback && feedback?.type === "error"
                              ? "ring-2 ring-red-300 border-red-300"
                              : ""
                          }`}
                        >
                          <CardContent className="py-4 px-5">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                              {/* Left side: Process info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <h3 className="font-medium text-sm">
                                    {proc.label}
                                  </h3>
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-medium">
                                      <CircleDot className="w-2.5 h-2.5" />
                                      Modified
                                    </span>
                                  )}
                                  {showFeedback && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-opacity ${
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

                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {proc.description}
                                </p>

                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {/* Used in pills */}
                                  <div className="flex items-center gap-1.5">
                                    <Hash className="w-3 h-3 text-muted-foreground/50" />
                                    {proc.usedIn
                                      .split(",")
                                      .map((usage, i) => (
                                        <span
                                          key={i}
                                          className="inline-block px-1.5 py-0.5 rounded bg-muted/60 text-[10px] text-muted-foreground font-medium"
                                        >
                                          {usage.trim()}
                                        </span>
                                      ))}
                                  </div>

                                  <span className="text-muted-foreground/30">
                                    |
                                  </span>

                                  {/* Source file badge */}
                                  <div className="flex items-center gap-1">
                                    <FileCode2 className="w-3 h-3 text-muted-foreground/50" />
                                    <code className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono">
                                      {proc.sourceFile}
                                    </code>
                                  </div>
                                </div>
                              </div>

                              {/* Right side: Model selector + provider badge */}
                              <div className="flex items-center gap-2 lg:min-w-[380px] shrink-0">
                                <Badge
                                  variant="outline"
                                  className={`shrink-0 text-xs ${providerColor?.badge || ""}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${providerColor?.dot || "bg-gray-400"} mr-1.5`}
                                  />
                                  {currentProvider}
                                </Badge>

                                <Select
                                  value={currentModel}
                                  onValueChange={(val) =>
                                    handleModelChange(proc.processId, val)
                                  }
                                >
                                  <SelectTrigger className="w-full text-sm h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(AVAILABLE_MODELS).map(
                                      ([provider, models]) => (
                                        <SelectGroup key={provider}>
                                          <SelectLabel className="text-xs font-semibold text-muted-foreground">
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
                                                <span>{m.label}</span>
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
                                    className="shrink-0 h-9 px-3 transition-all"
                                  >
                                    {isSaving ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                    <span className="ml-1 text-xs hidden sm:inline">
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
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          hasPendingChanges
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-screen-2xl px-6 pb-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-yellow-200 bg-white/95 backdrop-blur-sm shadow-lg shadow-yellow-100/50 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-yellow-100">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {pendingCount} unsaved change
                  {pendingCount !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Changes will take effect immediately once saved
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPendingChanges({})}
                disabled={saving !== null}
                className="text-muted-foreground hover:text-red-600"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Discard All
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={saving !== null}
                className="px-4"
              >
                {saving === "all" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
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
