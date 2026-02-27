'use client';

import { useState, useCallback, useRef } from 'react';
import { ModuleSchema, ModuleFieldDefinition, ModuleItem, PartnerModule } from '@/lib/modules/types';
import { generateSampleCSVAction, mapCSVColumnsAction } from '@/actions/import-actions';
import { bulkCreateModuleItemsAction } from '@/actions/modules-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    partnerId: string;
    userId: string;
    module: PartnerModule;
    schema: ModuleSchema;
    moduleSlug: string;
    onImportComplete: () => void;
}

type Step = 'upload' | 'mapping';

const CORE_FIELDS = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'currency', label: 'Currency' },
    { key: 'isActive', label: 'Active Status' },
    { key: 'isFeatured', label: 'Featured' },
    { key: 'stock', label: 'Stock' },
];

const MAX_ROWS = 500;
const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];

export function ImportDialog({
    open,
    onOpenChange,
    partnerId,
    userId,
    module: partnerModule,
    schema,
    moduleSlug,
    onImportComplete,
}: ImportDialogProps) {
    const [step, setStep] = useState<Step>('upload');
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [fileData, setFileData] = useState<Record<string, string>[]>([]);
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [confidence, setConfidence] = useState<Record<string, number>>({});
    const [isLoadingMappings, setIsLoadingMappings] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const schemaFieldsForMapping = schema.fields.filter(f => f.type !== 'image');

    const mappingOptions = [
        { value: 'skip', label: '— Skip —' },
        ...CORE_FIELDS.map(f => ({ value: f.key, label: f.label })),
        ...schemaFieldsForMapping.map(f => ({ value: f.id, label: f.name })),
    ];

    const resetState = useCallback(() => {
        setStep('upload');
        setFileHeaders([]);
        setFileData([]);
        setMappings({});
        setConfidence({});
        setIsLoadingMappings(false);
        setIsImporting(false);
        setFileName(null);
    }, []);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        if (!newOpen) {
            resetState();
        }
        onOpenChange(newOpen);
    }, [onOpenChange, resetState]);

    const handleDownloadSample = useCallback(async () => {
        setIsDownloading(true);
        try {
            const result = await generateSampleCSVAction(partnerId, moduleSlug);
            if (result.success && result.csvContent) {
                const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = result.filename || `${moduleSlug}-template.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success('Sample file downloaded');
            } else {
                toast.error(result.error || 'Failed to generate sample file');
            }
        } catch {
            toast.error('Failed to download sample file');
        } finally {
            setIsDownloading(false);
        }
    }, [partnerId, moduleSlug]);

    const parseFile = useCallback(async (file: File) => {
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!ACCEPTED_EXTENSIONS.includes(extension)) {
            toast.error('Invalid file type. Please upload a .csv, .xls, or .xlsx file.');
            return;
        }

        setFileName(file.name);

        try {
            let headers: string[] = [];
            let rows: Record<string, string>[] = [];

            if (extension === '.csv') {
                const text = await file.text();
                const parsed = Papa.parse<Record<string, string>>(text, {
                    header: true,
                    skipEmptyLines: true,
                });
                headers = parsed.meta.fields || [];
                rows = parsed.data;
            } else {
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '' });
                if (jsonData.length > 0) {
                    headers = Object.keys(jsonData[0]);
                }
                rows = jsonData.map(row => {
                    const stringRow: Record<string, string> = {};
                    for (const key of headers) {
                        stringRow[key] = String(row[key] ?? '');
                    }
                    return stringRow;
                });
            }

            if (headers.length === 0) {
                toast.error('Could not read column headers from the file');
                return;
            }

            if (rows.length > MAX_ROWS) {
                toast.warning(`File contains ${rows.length} rows. Only the first ${MAX_ROWS} will be imported.`);
                rows = rows.slice(0, MAX_ROWS);
            }

            setFileHeaders(headers);
            setFileData(rows);

            setIsLoadingMappings(true);
            setStep('mapping');

            const mapResult = await mapCSVColumnsAction(headers, schema.fields);

            if (mapResult.success && mapResult.mappings) {
                setMappings(mapResult.mappings);
                setConfidence(mapResult.confidence || {});
            } else {
                const fallbackMappings: Record<string, string> = {};
                headers.forEach(h => { fallbackMappings[h] = 'skip'; });
                setMappings(fallbackMappings);
                toast.error('AI mapping failed. Please map columns manually.');
            }

            setIsLoadingMappings(false);
        } catch {
            toast.error('Failed to parse file');
            setIsLoadingMappings(false);
        }
    }, [schema.fields]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            parseFile(files[0]);
        }
    }, [parseFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            parseFile(files[0]);
        }
        e.target.value = '';
    }, [parseFile]);

    const handleMappingChange = useCallback((header: string, value: string) => {
        setMappings(prev => ({ ...prev, [header]: value }));
    }, []);

    const handleImport = useCallback(async () => {
        setIsImporting(true);

        try {
            const coreFieldKeys = new Set(CORE_FIELDS.map(f => f.key));
            const schemaFieldIds = new Set(schemaFieldsForMapping.map(f => f.id));

            const items: Partial<ModuleItem>[] = fileData.map(row => {
                const item: Partial<ModuleItem> = {
                    isActive: true,
                    isFeatured: false,
                    fields: {},
                    images: [],
                };

                for (const header of fileHeaders) {
                    const target = mappings[header];
                    if (!target || target === 'skip') continue;

                    const rawValue = row[header];
                    if (rawValue === undefined || rawValue === '') continue;

                    if (coreFieldKeys.has(target)) {
                        switch (target) {
                            case 'name':
                                item.name = rawValue;
                                break;
                            case 'description':
                                item.description = rawValue;
                                break;
                            case 'category':
                                item.category = rawValue;
                                break;
                            case 'price': {
                                const num = parseFloat(rawValue);
                                if (!isNaN(num)) item.price = num;
                                break;
                            }
                            case 'currency':
                                item.currency = rawValue;
                                break;
                            case 'isActive':
                                item.isActive = rawValue.toLowerCase() !== 'false' && rawValue !== '0';
                                break;
                            case 'isFeatured':
                                item.isFeatured = rawValue.toLowerCase() === 'true' || rawValue === '1';
                                break;
                            case 'stock': {
                                const stockNum = parseInt(rawValue, 10);
                                if (!isNaN(stockNum)) item.stock = stockNum;
                                break;
                            }
                        }
                    } else if (schemaFieldIds.has(target)) {
                        const field = schemaFieldsForMapping.find(f => f.id === target);
                        if (field) {
                            switch (field.type) {
                                case 'number':
                                case 'currency':
                                case 'duration': {
                                    const n = parseFloat(rawValue);
                                    item.fields![target] = isNaN(n) ? rawValue : n;
                                    break;
                                }
                                case 'toggle':
                                    item.fields![target] = rawValue.toLowerCase() === 'true' || rawValue === '1';
                                    break;
                                case 'multi_select':
                                case 'tags':
                                    item.fields![target] = rawValue.split(/[;,]/).map(v => v.trim()).filter(Boolean);
                                    break;
                                default:
                                    item.fields![target] = rawValue;
                                    break;
                            }
                        }
                    }
                }

                if (!item.name) {
                    item.name = 'Untitled';
                }

                return item;
            });

            const result = await bulkCreateModuleItemsAction(
                partnerId,
                partnerModule.id,
                items,
                userId
            );

            if (result.success && result.data) {
                toast.success(`Imported ${result.data.created} items${result.data.failed > 0 ? ` (${result.data.failed} failed)` : ''}`);
                onImportComplete();
                handleOpenChange(false);
            } else {
                toast.error(result.error || 'Import failed');
            }
        } catch {
            toast.error('Import failed');
        } finally {
            setIsImporting(false);
        }
    }, [fileData, fileHeaders, mappings, schemaFieldsForMapping, partnerId, partnerModule.id, userId, onImportComplete, handleOpenChange]);

    const mappedCount = Object.values(mappings).filter(v => v && v !== 'skip').length;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Items</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 mb-6">
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {step === 'mapping' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                        </div>
                        Upload
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'mapping' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'mapping' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            2
                        </div>
                        Map Fields
                    </div>
                </div>

                {step === 'upload' && (
                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            onClick={handleDownloadSample}
                            disabled={isDownloading}
                            className="w-full justify-start gap-2"
                        >
                            {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Download Sample CSV Template
                        </Button>

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative cursor-pointer text-center py-16 border-2 border-dashed rounded-lg transition-colors ${
                                isDragging
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted-foreground/25 bg-muted/10 hover:border-muted-foreground/50'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xls,.xlsx"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="flex flex-col items-center gap-3">
                                {isDragging ? (
                                    <Upload className="h-10 w-10 text-primary" />
                                ) : (
                                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                                )}
                                <div>
                                    <p className="text-sm font-medium">
                                        {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        or click to browse
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Accepts .csv, .xls, .xlsx — max {MAX_ROWS} rows
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'mapping' && (
                    <div className="space-y-4">
                        {fileName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                                <FileSpreadsheet className="h-4 w-4" />
                                {fileName} — {fileData.length} rows
                            </div>
                        )}

                        {isLoadingMappings ? (
                            <div className="flex flex-col items-center gap-3 py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">AI is mapping your columns...</p>
                            </div>
                        ) : (
                            <>
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-2 gap-0 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <div>Your File Column</div>
                                        <div>Maps To</div>
                                    </div>
                                    <div className="divide-y max-h-[40vh] overflow-y-auto">
                                        {fileHeaders.map(header => (
                                            <div key={header} className="grid grid-cols-2 gap-4 px-4 py-2.5 items-center">
                                                <div className="text-sm font-medium truncate" title={header}>
                                                    {header}
                                                    {confidence[header] !== undefined && confidence[header] >= 0.9 && (
                                                        <CheckCircle2 className="inline ml-1.5 h-3.5 w-3.5 text-green-500" />
                                                    )}
                                                </div>
                                                <Select
                                                    value={mappings[header] || 'skip'}
                                                    onValueChange={(val) => handleMappingChange(header, val)}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {mappingOptions.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {mappedCount === 0 && (
                                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
                                        <AlertTriangle className="h-4 w-4" />
                                        No columns are mapped. Please map at least the "Name" column.
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setStep('upload');
                                            setFileHeaders([]);
                                            setFileData([]);
                                            setMappings({});
                                            setConfidence({});
                                            setFileName(null);
                                        }}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleImport}
                                        disabled={isImporting || mappedCount === 0}
                                    >
                                        {isImporting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Import {fileData.length} rows
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
