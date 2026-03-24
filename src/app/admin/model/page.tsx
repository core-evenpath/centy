// src/app/admin/model/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import AdminHeader from "../../../components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
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
} from "lucide-react";
import {
  getSystemModelConfig,
  updateProcessModel,
  resetToDefaults,
  DEFAULT_PROCESSES,
  AVAILABLE_MODELS,
  type SystemModelConfig,
} from "../../../actions/model-config-actions";
import { useAuth } from "../../../hooks/use-auth";

type CategoryType = 'generation' | 'embedding' | 'image' | 'retrieval';

const CATEGORY_CONFIG: Record<CategoryType, { label: string; icon: typeof Brain; color: string }> = {
  generation: { label: "Text Generation", icon: Sparkles, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  retrieval: { label: "Retrieval & Search", icon: Search, color: "bg-green-500/10 text-green-600 border-green-200" },
  image: { label: "Image Generation", icon: ImageIcon, color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  embedding: { label: "Embeddings", icon: Database, color: "bg-orange-500/10 text-orange-600 border-orange-200" },
};

const PROVIDER_BADGE: Record<string, string> = {
  Google: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  Anthropic: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  OpenAI: "bg-green-100 text-green-700 hover:bg-green-100",
};

// Build flat list of all available models for select dropdown
const ALL_MODELS = Object.entries(AVAILABLE_MODELS).flatMap(([provider, models]) =>
  models.map((m) => ({ ...m, provider }))
);

interface PendingChange {
  model: string;
  provider: string;
}

export default function AdminModelPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<SystemModelConfig>({});
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{ processId: string; type: 'success' | 'error'; message: string } | null>(null);

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
      const result = await updateProcessModel(processId, change.model, change.provider, user.uid);
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
      const result = await updateProcessModel(processId, change.model, change.provider, user.uid);
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
        setFeedback({ processId: "all", type: "success", message: "Reset to defaults" });
      } else {
        setFeedback({ processId: "all", type: "error", message: result.message });
      }
    } catch {
      setFeedback({ processId: "all", type: "error", message: "Failed to reset" });
    } finally {
      setResetting(false);
    }
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // Group processes by category
  const grouped = DEFAULT_PROCESSES.reduce<Record<CategoryType, typeof DEFAULT_PROCESSES>>(
    (acc, proc) => {
      acc[proc.category].push(proc);
      return acc;
    },
    { generation: [], retrieval: [], image: [], embedding: [] }
  );

  return (
    <>
      <AdminHeader
        title="AI Models"
        subtitle="View and manage AI model assignments across all system processes."
        actions={
          <div className="flex items-center gap-2">
            {hasPendingChanges && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {Object.keys(pendingChanges).length} unsaved
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={resetting || saving !== null}
            >
              {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              <span className="hidden md:inline ml-1">Reset Defaults</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadConfig}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden md:inline ml-1">Refresh</span>
            </Button>
            {hasPendingChanges && (
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={saving !== null}
              >
                {saving === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="ml-1">Save All</span>
              </Button>
            )}
          </div>
        }
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Global feedback banner */}
        {feedback?.processId === "all" && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {feedback.message}
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(["Google", "Anthropic", "OpenAI"] as const).map((provider) => {
            const count = DEFAULT_PROCESSES.filter(
              (p) => getCurrentProvider(p.processId, p.provider) === provider
            ).length;
            if (count === 0) return null;
            return (
              <Card key={provider}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{provider}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <Badge className={PROVIDER_BADGE[provider]}>{count} process{count !== 1 ? "es" : ""}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{DEFAULT_PROCESSES.length}</p>
                </div>
                <Brain className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.entries(grouped) as [CategoryType, typeof DEFAULT_PROCESSES][]).map(
              ([category, processes]) => {
                if (processes.length === 0) return null;
                const catConfig = CATEGORY_CONFIG[category];
                const CatIcon = catConfig.icon;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded-md border ${catConfig.color}`}>
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-semibold">{catConfig.label}</h2>
                      <Badge variant="secondary" className="ml-1">{processes.length}</Badge>
                    </div>

                    <div className="grid gap-3">
                      {processes.map((proc) => {
                        const currentModel = getCurrentModel(proc.processId, proc.currentModel);
                        const currentProvider = getCurrentProvider(proc.processId, proc.provider);
                        const isPending = !!pendingChanges[proc.processId];
                        const isSaving = saving === proc.processId;
                        const showFeedback = feedback?.processId === proc.processId;

                        return (
                          <Card
                            key={proc.processId}
                            className={`transition-all ${
                              isPending ? "ring-2 ring-yellow-300 border-yellow-300" : ""
                            } ${showFeedback && feedback?.type === "success" ? "ring-2 ring-green-300 border-green-300" : ""}`}
                          >
                            <CardContent className="py-4">
                              <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Process info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-sm">{proc.label}</h3>
                                    <Badge className={PROVIDER_BADGE[currentProvider]} variant="outline">
                                      {currentProvider}
                                    </Badge>
                                    {isPending && (
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
                                        unsaved
                                      </Badge>
                                    )}
                                    {showFeedback && (
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          feedback?.type === "success"
                                            ? "bg-green-50 text-green-700 border-green-300"
                                            : "bg-red-50 text-red-700 border-red-300"
                                        }`}
                                      >
                                        {feedback?.type === "success" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                        {feedback?.message}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{proc.description}</p>
                                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                                    Source: <code className="text-xs">{proc.sourceFile}</code>
                                  </p>
                                </div>

                                {/* Model selector */}
                                <div className="flex items-center gap-2 md:min-w-[340px]">
                                  <Select
                                    value={currentModel}
                                    onValueChange={(val) => handleModelChange(proc.processId, val)}
                                  >
                                    <SelectTrigger className="w-full text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(AVAILABLE_MODELS).map(([provider, models]) => (
                                        <SelectGroup key={provider}>
                                          <SelectLabel className="text-xs font-semibold text-muted-foreground">
                                            {provider}
                                          </SelectLabel>
                                          {models.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                              <div className="flex items-center gap-2">
                                                <span>{m.label}</span>
                                                <span className="text-xs text-muted-foreground hidden md:inline">
                                                  - {m.capability}
                                                </span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {isPending && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleSave(proc.processId)}
                                      disabled={isSaving}
                                      className="shrink-0"
                                    >
                                      {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Save className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </main>
    </>
  );
}
