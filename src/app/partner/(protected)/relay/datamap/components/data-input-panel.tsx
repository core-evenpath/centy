"use client";

import { useState, useRef, useCallback } from "react";
import { Icon } from "./icon";
import { ACCENT, theme } from "../constants";
import type { MappedFeature } from "../types";

interface DataInputPanelProps {
  feature: MappedFeature;
  enabledApis: string[];
  /** Called when the user selects a file for upload */
  onFileUpload?: (featureId: string, file: File) => void;
  /** Called when the user chooses "Use Core Memory documents" */
  onUseMemory?: (featureId: string) => void;
  /** Called when the user chooses "Fetch from API" */
  onFetchApi?: (featureId: string, apiName: string) => void;
  /** Called when the user chooses "Enter manually" */
  onManualEntry?: (featureId: string) => void;
  /** Called when the user chooses "Connect a service" */
  onConnectService?: (featureId: string) => void;
}

/**
 * Expandable panel for a single feature's data input options.
 *
 * BUG 5 FIX: All buttons now have actual click handlers.
 * The file upload button triggers a real file picker.
 * Other options call parent callbacks so the page can handle navigation.
 */
export function DataInputPanel({
  feature,
  enabledApis,
  onFileUpload,
  onUseMemory,
  onFetchApi,
  onManualEntry,
  onConnectService,
}: DataInputPanelProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      onFileUpload?.(feature.id, file);
    },
    [feature.id, onFileUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {/* Upload option */}
      <button
        onClick={() => setUploadOpen(!uploadOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          width: "100%",
          borderRadius: 8,
          border: `1px solid ${uploadOpen ? theme.accentBg2 : theme.bdrL}`,
          background: uploadOpen ? theme.accentBg : theme.surface,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Icon name="upload" size={14} color={ACCENT} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>
            Upload a document
          </div>
          <div style={{ fontSize: 10, color: theme.t4 }}>
            PDF, CSV, Excel — AI reads and maps it
          </div>
        </div>
        <Icon name="arrowR" size={12} color={theme.t4} />
      </button>

      {/* Expanded upload zone */}
      {uploadOpen && (
        <div
          style={{
            marginLeft: 18,
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${theme.accentBg2}`,
            background: theme.accentBg,
          }}
        >
          {/* BUG 5 FIX — real drag-and-drop + file picker */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `1px dashed ${dragActive ? ACCENT : theme.bdrM}`,
              borderRadius: 6,
              padding: "14px 10px",
              textAlign: "center",
              marginBottom: 8,
              cursor: "pointer",
              background: dragActive ? theme.accentBg2 : "transparent",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <Icon name="upload" size={18} color={dragActive ? ACCENT : theme.t4} />
            <div style={{ fontSize: 10, fontWeight: 500, color: theme.t2, marginTop: 4 }}>
              {dragActive ? "Drop it here" : "Drop file or click to browse"}
            </div>
            <div style={{ fontSize: 9, color: theme.t4, marginTop: 2 }}>
              PDF, CSV, XLSX, JSON, TXT
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.csv,.xlsx,.xls,.json,.txt"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Template download */}
          {feature.templateCols && feature.templateCols.length > 0 && (
            <button
              onClick={() => {
                // TODO: Generate and download template CSV/XLSX
                const header = feature.templateCols!.join(",");
                const blob = new Blob([header + "\n"], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${feature.id}-template.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 10px",
                width: "100%",
                borderRadius: 6,
                border: `1px solid ${theme.accentBg2}`,
                background: theme.surface,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Icon name="download" size={12} color={ACCENT} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: ACCENT }}>
                  Download template
                </div>
                <div style={{ fontSize: 9, color: theme.t3 }}>
                  {feature.templateCols.join(" · ")}
                </div>
              </div>
            </button>
          )}

          <div style={{ fontSize: 9, color: theme.t3, marginTop: 6, lineHeight: 1.4 }}>
            AI maps the content to the right fields. You review before anything goes live.
          </div>
        </div>
      )}

      {/* Core Memory option */}
      <button
        onClick={() => onUseMemory?.(feature.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          width: "100%",
          borderRadius: 8,
          border: `1px solid ${theme.bdrL}`,
          background: theme.surface,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Icon name="db" size={14} color={theme.t3} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>
            Use Core Memory documents
          </div>
          <div style={{ fontSize: 10, color: theme.t4 }}>
            Extract from files already in your account
          </div>
        </div>
        <Icon name="arrowR" size={12} color={theme.t4} />
      </button>

      {/* API fetch option — only if integrations exist and no backend required */}
      {enabledApis.length > 0 && !feature.backend && (
        <button
          onClick={() => onFetchApi?.(feature.id, enabledApis[0])}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            width: "100%",
            borderRadius: 8,
            border: `1px solid ${theme.bdrL}`,
            background: theme.surface,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Icon name="api" size={14} color={theme.t3} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>
              Fetch from an API
            </div>
            <div style={{ fontSize: 10, color: theme.t4 }}>
              {enabledApis.join(", ")}
            </div>
          </div>
          <Icon name="arrowR" size={12} color={theme.t4} />
        </button>
      )}

      {/* Connect a service — only for backend-required features */}
      {feature.backend && (
        <button
          onClick={() => onConnectService?.(feature.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            width: "100%",
            borderRadius: 8,
            border: `1px solid ${theme.bdrL}`,
            background: theme.surface,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Icon name="link" size={14} color={theme.t3} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>
              Connect a service
            </div>
            <div style={{ fontSize: 10, color: theme.t4 }}>
              Payment gateway, order system, or custom API
            </div>
          </div>
          <Icon name="arrowR" size={12} color={theme.t4} />
        </button>
      )}

      {/* Manual entry — only for non-backend features */}
      {!feature.backend && (
        <button
          onClick={() => onManualEntry?.(feature.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            width: "100%",
            borderRadius: 8,
            border: `1px solid ${theme.bdrL}`,
            background: theme.surface,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Icon name="plus" size={14} color={theme.t3} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>
              Enter manually
            </div>
            <div style={{ fontSize: 10, color: theme.t4 }}>
              Type it in yourself
            </div>
          </div>
          <Icon name="arrowR" size={12} color={theme.t4} />
        </button>
      )}
    </div>
  );
}
