'use client';

import type { FlowStage, FlowStageType, IntentSignal } from '@/lib/types-flow-engine';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { GripVertical, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const STAGE_TYPE_LABELS: Record<FlowStageType, string> = {
    greeting: 'Greeting',
    discovery: 'Discovery',
    showcase: 'Showcase',
    comparison: 'Comparison',
    social_proof: 'Social Proof',
    conversion: 'Conversion',
    objection: 'Objection Handling',
    handoff: 'Handoff',
    followup: 'Follow-up',
};

const STAGE_TYPE_COLORS: Record<FlowStageType, string> = {
    greeting: 'bg-blue-100 text-blue-700',
    discovery: 'bg-emerald-100 text-emerald-700',
    showcase: 'bg-purple-100 text-purple-700',
    comparison: 'bg-amber-100 text-amber-700',
    social_proof: 'bg-pink-100 text-pink-700',
    conversion: 'bg-green-100 text-green-700',
    objection: 'bg-orange-100 text-orange-700',
    handoff: 'bg-red-100 text-red-700',
    followup: 'bg-gray-100 text-gray-700',
};

const ALL_STAGE_TYPES: FlowStageType[] = [
    'greeting', 'discovery', 'showcase', 'comparison', 'social_proof',
    'conversion', 'objection', 'handoff', 'followup',
];

const ALL_INTENTS: IntentSignal[] = [
    'browsing', 'comparing', 'pricing', 'booking', 'inquiry', 'complaint',
    'returning', 'urgent', 'location', 'contact', 'promo', 'schedule',
];

interface FlowStageCardProps {
    stage: FlowStage;
    isActive?: boolean;
    onUpdate: (updated: FlowStage) => void;
    onDelete: () => void;
}

export default function FlowStageCard({ stage, isActive, onUpdate, onDelete }: FlowStageCardProps) {
    const [expanded, setExpanded] = useState(false);

    const toggleIntent = (intent: IntentSignal, field: 'triggerIntents' | 'exitIntents') => {
        const current = stage[field];
        const updated = current.includes(intent)
            ? current.filter(i => i !== intent)
            : [...current, intent];
        onUpdate({ ...stage, [field]: updated });
    };

    return (
        <Card className={`transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="mt-1 cursor-grab text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className={STAGE_TYPE_COLORS[stage.type]}>
                                {STAGE_TYPE_LABELS[stage.type]}
                            </Badge>
                            {stage.isEntry && <Badge variant="outline" className="text-[10px]">Entry</Badge>}
                            {stage.isExit && <Badge variant="outline" className="text-[10px]">Exit</Badge>}
                            <span className="text-sm font-medium truncate">{stage.label}</span>
                            <div className="ml-auto flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => setExpanded(!expanded)}
                                >
                                    {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                    onClick={onDelete}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {expanded && (
                            <div className="space-y-4 mt-3 pt-3 border-t">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Label</label>
                                        <Input
                                            value={stage.label}
                                            onChange={e => onUpdate({ ...stage, label: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Stage Type</label>
                                        <Select
                                            value={stage.type}
                                            onValueChange={v => onUpdate({ ...stage, type: v as FlowStageType })}
                                        >
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_STAGE_TYPES.map(t => (
                                                    <SelectItem key={t} value={t}>{STAGE_TYPE_LABELS[t]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                                    <Textarea
                                        value={stage.description || ''}
                                        onChange={e => onUpdate({ ...stage, description: e.target.value })}
                                        rows={2}
                                        className="text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Lead Score Impact</label>
                                        <Input
                                            type="number"
                                            value={stage.leadScoreImpact}
                                            onChange={e => onUpdate({ ...stage, leadScoreImpact: parseInt(e.target.value) || 0 })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Block Types</label>
                                        <Input
                                            value={stage.blockTypes.join(', ')}
                                            onChange={e => onUpdate({ ...stage, blockTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                            placeholder="catalog, pricing"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Trigger Intents</label>
                                    <div className="flex flex-wrap gap-1">
                                        {ALL_INTENTS.map(intent => (
                                            <button
                                                key={intent}
                                                onClick={() => toggleIntent(intent, 'triggerIntents')}
                                                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                                                    stage.triggerIntents.includes(intent)
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-muted border-transparent hover:border-muted-foreground/30'
                                                }`}
                                            >
                                                {intent}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Exit Intents</label>
                                    <div className="flex flex-wrap gap-1">
                                        {ALL_INTENTS.map(intent => (
                                            <button
                                                key={intent}
                                                onClick={() => toggleIntent(intent, 'exitIntents')}
                                                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                                                    stage.exitIntents.includes(intent)
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-muted border-transparent hover:border-muted-foreground/30'
                                                }`}
                                            >
                                                {intent}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={stage.isEntry || false}
                                            onChange={e => onUpdate({ ...stage, isEntry: e.target.checked })}
                                            className="rounded"
                                        />
                                        Entry Stage
                                    </label>
                                    <label className="flex items-center gap-2 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={stage.isExit || false}
                                            onChange={e => onUpdate({ ...stage, isExit: e.target.checked })}
                                            className="rounded"
                                        />
                                        Exit Stage
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export { STAGE_TYPE_LABELS, STAGE_TYPE_COLORS };
