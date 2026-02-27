"use client";

import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Contact } from '@/lib/types';

interface CSVVariableUploadProps {
    variableTokens: string[];
    contacts: Contact[];
    onComplete: (csvData: Map<string, Record<string, string>>) => void;
    onClose: () => void;
}

function normalizePhone(raw: string): string {
    let cleaned = raw.replace(/[\s\-\+\(\)]/g, '');
    if (cleaned.startsWith('91') && cleaned.length > 10) cleaned = cleaned.slice(2);
    if (cleaned.startsWith('0') && cleaned.length > 10) cleaned = cleaned.slice(1);
    return cleaned.slice(-10);
}

type Step = 'upload' | 'map' | 'match' | 'done';

export function CSVVariableUpload({ variableTokens, contacts, onComplete, onClose }: CSVVariableUploadProps) {
    const [step, setStep] = useState<Step>('upload');
    const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [phoneColumn, setPhoneColumn] = useState<string>('');
    const [columnMap, setColumnMap] = useState<Record<string, string>>({});
    const [matchStats, setMatchStats] = useState({ matched: 0, unmatched: 0, total: 0 });
    const [csvDataMap, setCsvDataMap] = useState<Map<string, Record<string, string>>>(new Map());
    const [fileName, setFileName] = useState('');

    const parseFile = useCallback((file: File) => {
        setFileName(file.name);
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.data.length === 0) return;
                    const headers = Object.keys(results.data[0] as Record<string, string>);
                    setCsvHeaders(headers);
                    setRawRows(results.data as Record<string, string>[]);
                    const phoneCol = headers.find(h => /phone|mobile|number|contact/i.test(h)) || headers[0];
                    setPhoneColumn(phoneCol);
                    setStep('map');
                },
            });
        } else if (ext === 'xls' || ext === 'xlsx') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result;
                const wb = XLSX.read(data, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
                if (rows.length === 0) return;
                const headers = Object.keys(rows[0]);
                setCsvHeaders(headers);
                setRawRows(rows);
                const phoneCol = headers.find(h => /phone|mobile|number|contact/i.test(h)) || headers[0];
                setPhoneColumn(phoneCol);
                setStep('map');
            };
            reader.readAsBinaryString(file);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) parseFile(file);
    }, [parseFile]);

    const doMatch = () => {
        const contactPhoneMap = new Map<string, string>();
        contacts.forEach(c => {
            if (c.phone) contactPhoneMap.set(normalizePhone(c.phone), c.id);
        });

        const dataMap = new Map<string, Record<string, string>>();
        let matched = 0;

        rawRows.forEach(row => {
            const rawPhone = row[phoneColumn] || '';
            const normPhone = normalizePhone(rawPhone);
            const contactId = contactPhoneMap.get(normPhone);

            if (contactId) {
                matched++;
                const mapped: Record<string, string> = {};
                Object.entries(columnMap).forEach(([token, col]) => {
                    mapped[token] = row[col] || '';
                });
                dataMap.set(normPhone, mapped);
            }
        });

        setCsvDataMap(dataMap);
        setMatchStats({ matched, unmatched: rawRows.length - matched, total: rawRows.length });
        setStep('done');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">CSV / XLS Variable Upload</h4>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <div className="flex items-center gap-2 mb-4">
                {(['upload', 'map', 'match', 'done'] as Step[]).map((s, i) => (
                    <React.Fragment key={s}>
                        <div className={`flex items-center gap-1.5 ${step === s ? 'text-indigo-600 font-semibold' : s < step ? 'text-emerald-600' : 'text-gray-400'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === s ? 'border-indigo-500 bg-indigo-50' :
                                    (['upload', 'map', 'match', 'done'].indexOf(step) > i) ? 'border-emerald-500 bg-emerald-50 text-emerald-600' :
                                        'border-gray-300 bg-gray-50'
                                }`}>
                                {(['upload', 'map', 'match', 'done'].indexOf(step) > i) ? '✓' : i + 1}
                            </span>
                            <span className="text-xs hidden sm:inline">
                                {s === 'upload' ? 'Upload' : s === 'map' ? 'Map' : s === 'match' ? 'Match' : 'Done'}
                            </span>
                        </div>
                        {i < 3 && <div className="flex-1 h-px bg-gray-200" />}
                    </React.Fragment>
                ))}
            </div>

            {step === 'upload' && (
                <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                >
                    <input
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
                        className="hidden"
                        id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                        <span className="text-3xl block mb-2">📄</span>
                        <span className="text-sm font-medium text-gray-700">Drop CSV/XLS here or click to upload</span>
                        <span className="text-xs text-gray-400 block mt-1">Must include a phone number column for matching</span>
                    </label>
                </div>
            )}

            {step === 'map' && (
                <div className="space-y-4">
                    <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700">
                        ✅ Loaded <strong>{rawRows.length}</strong> rows from <strong>{fileName}</strong>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                            Phone number column (for matching contacts)
                        </label>
                        <select
                            value={phoneColumn}
                            onChange={e => setPhoneColumn(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                            {csvHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t pt-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Map CSV columns → Template variables
                        </div>
                        <div className="space-y-3">
                            {variableTokens.map(token => (
                                <div key={token} className="flex items-center gap-3">
                                    <span className="font-mono text-xs text-indigo-600 font-bold w-12 text-right">{token}</span>
                                    <span className="text-gray-400">→</span>
                                    <select
                                        value={columnMap[token] || ''}
                                        onChange={e => setColumnMap({ ...columnMap, [token]: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    >
                                        <option value="">— skip —</option>
                                        {csvHeaders.filter(h => h !== phoneColumn).map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={doMatch}
                        disabled={Object.values(columnMap).filter(Boolean).length === 0}
                        className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Match & Import
                    </button>
                </div>
            )}

            {step === 'done' && (
                <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                        <span className="text-3xl block mb-2">✅</span>
                        <div className="text-sm font-semibold text-emerald-800">
                            {matchStats.matched} of {matchStats.total} rows matched
                        </div>
                        {matchStats.unmatched > 0 && (
                            <div className="text-xs text-amber-600 mt-1">
                                ⚠️ {matchStats.unmatched} rows had no matching contact (phone not found)
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => { onComplete(csvDataMap); onClose(); }}
                        className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                        Apply Variable Data
                    </button>
                </div>
            )}
        </div>
    );
}
