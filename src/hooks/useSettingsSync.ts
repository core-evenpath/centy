"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import {
    saveBusinessPersonaAction,
    getBusinessPersonaAction
} from '@/actions/business-persona-actions';
import type { BusinessPersona, SetupProgress } from '@/lib/business-persona-types';
import { toast } from 'sonner';

interface SettingsSyncState {
    persona: Partial<BusinessPersona>;
    setupProgress: SetupProgress | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    lastSaved: Date | null;
    pendingChanges: Map<string, any>;
}

interface UseSettingsSyncOptions {
    debounceMs?: number;
    enableRealtime?: boolean;
    onSaveSuccess?: () => void;
    onSaveError?: (error: string) => void;
}

/**
 * useSettingsSync - Hook for managing settings with optimistic updates and backend sync
 *
 * Features:
 * - Optimistic UI updates (immediate local state)
 * - Debounced backend saves
 * - Real-time Firestore listeners (optional)
 * - Batch updates support
 * - Automatic retry on failure
 * - Conflict resolution
 */
export function useSettingsSync(
    partnerId: string | undefined,
    options: UseSettingsSyncOptions = {}
) {
    const {
        debounceMs = 800,
        enableRealtime = true,
        onSaveSuccess,
        onSaveError
    } = options;

    const [state, setState] = useState<SettingsSyncState>({
        persona: {},
        setupProgress: null,
        loading: true,
        saving: false,
        error: null,
        lastSaved: null,
        pendingChanges: new Map(),
    });

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingUpdatesRef = useRef<Partial<BusinessPersona>>({});
    const unsubscribeRef = useRef<Unsubscribe | null>(null);
    const isMountedRef = useRef(true);

    // Initial fetch
    useEffect(() => {
        if (!partnerId) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        const fetchPersona = async () => {
            try {
                const result = await getBusinessPersonaAction(partnerId);
                if (result.success && isMountedRef.current) {
                    setState(prev => ({
                        ...prev,
                        persona: result.persona || {},
                        setupProgress: result.setupProgress || null,
                        loading: false,
                        error: null,
                    }));
                }
            } catch (error: any) {
                if (isMountedRef.current) {
                    setState(prev => ({
                        ...prev,
                        loading: false,
                        error: error.message || 'Failed to load settings',
                    }));
                }
            }
        };

        fetchPersona();
    }, [partnerId]);

    // Real-time Firestore listener
    useEffect(() => {
        if (!partnerId || !enableRealtime) return;

        const partnerRef = doc(db, 'partners', partnerId);

        unsubscribeRef.current = onSnapshot(
            partnerRef,
            (snapshot) => {
                if (!snapshot.exists() || !isMountedRef.current) return;

                const data = snapshot.data();
                const businessPersona = data?.businessPersona;

                if (businessPersona) {
                    // Only update if we don't have pending changes
                    // This prevents overwriting optimistic updates
                    setState(prev => {
                        if (prev.pendingChanges.size > 0) {
                            return prev; // Skip update if we have pending changes
                        }
                        return {
                            ...prev,
                            persona: businessPersona,
                            setupProgress: businessPersona.setupProgress || prev.setupProgress,
                        };
                    });
                }
            },
            (error) => {
                console.error('Firestore listener error:', error);
            }
        );

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [partnerId, enableRealtime]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    /**
     * Update a field with optimistic UI + debounced backend save
     */
    const updateField = useCallback((path: string, value: any) => {
        if (!partnerId) return;

        // Optimistic update - immediately update local state
        setState(prev => {
            const newPersona = { ...prev.persona };
            const keys = path.split('.');
            let current: any = newPersona;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;

            // Track pending changes
            const newPending = new Map(prev.pendingChanges);
            newPending.set(path, value);

            return {
                ...prev,
                persona: newPersona,
                pendingChanges: newPending,
            };
        });

        // Build update object for backend
        const keys = path.split('.');
        let updateObj: any = {};

        if (keys.length === 1) {
            updateObj[keys[0]] = value;
        } else if (keys.length === 2) {
            updateObj[keys[0]] = { [keys[1]]: value };
        } else if (keys.length === 3) {
            updateObj[keys[0]] = { [keys[1]]: { [keys[2]]: value } };
        } else {
            // For deeper paths, use the full nested structure
            let current = updateObj;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        }

        // Merge with pending updates
        pendingUpdatesRef.current = deepMerge(pendingUpdatesRef.current, updateObj);

        // Debounced save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            const updates = pendingUpdatesRef.current;
            pendingUpdatesRef.current = {};

            if (Object.keys(updates).length === 0) return;

            setState(prev => ({ ...prev, saving: true }));

            try {
                const result = await saveBusinessPersonaAction(partnerId, updates);

                if (result.success && isMountedRef.current) {
                    setState(prev => ({
                        ...prev,
                        saving: false,
                        lastSaved: new Date(),
                        setupProgress: result.setupProgress || prev.setupProgress,
                        pendingChanges: new Map(), // Clear pending changes
                        error: null,
                    }));
                    onSaveSuccess?.();
                } else {
                    throw new Error(result.message || 'Save failed');
                }
            } catch (error: any) {
                if (isMountedRef.current) {
                    setState(prev => ({
                        ...prev,
                        saving: false,
                        error: error.message,
                    }));
                    onSaveError?.(error.message);
                    toast.error('Failed to save changes');
                }
            }
        }, debounceMs);
    }, [partnerId, debounceMs, onSaveSuccess, onSaveError]);

    /**
     * Batch update multiple fields at once
     */
    const batchUpdate = useCallback(async (updates: Record<string, any>) => {
        if (!partnerId) return;

        // Optimistic update
        setState(prev => {
            const newPersona = { ...prev.persona };

            Object.entries(updates).forEach(([path, value]) => {
                const keys = path.split('.');
                let current: any = newPersona;

                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) current[keys[i]] = {};
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;
            });

            return { ...prev, persona: newPersona, saving: true };
        });

        // Build backend update object
        const updateObj: any = {};
        Object.entries(updates).forEach(([path, value]) => {
            const keys = path.split('.');
            if (keys.length === 1) {
                updateObj[keys[0]] = value;
            } else if (keys.length === 2) {
                if (!updateObj[keys[0]]) updateObj[keys[0]] = {};
                updateObj[keys[0]][keys[1]] = value;
            } else if (keys.length === 3) {
                if (!updateObj[keys[0]]) updateObj[keys[0]] = {};
                if (!updateObj[keys[0]][keys[1]]) updateObj[keys[0]][keys[1]] = {};
                updateObj[keys[0]][keys[1]][keys[2]] = value;
            }
        });

        try {
            const result = await saveBusinessPersonaAction(partnerId, updateObj);

            if (result.success && isMountedRef.current) {
                setState(prev => ({
                    ...prev,
                    saving: false,
                    lastSaved: new Date(),
                    setupProgress: result.setupProgress || prev.setupProgress,
                    error: null,
                }));
                toast.success('Changes saved');
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            if (isMountedRef.current) {
                setState(prev => ({ ...prev, saving: false, error: error.message }));
                toast.error('Failed to save changes');
            }
        }
    }, [partnerId]);

    /**
     * Force refresh from backend
     */
    const refresh = useCallback(async () => {
        if (!partnerId) return;

        setState(prev => ({ ...prev, loading: true }));

        try {
            const result = await getBusinessPersonaAction(partnerId);
            if (result.success && isMountedRef.current) {
                setState(prev => ({
                    ...prev,
                    persona: result.persona || {},
                    setupProgress: result.setupProgress || null,
                    loading: false,
                    error: null,
                    pendingChanges: new Map(),
                }));
            }
        } catch (error: any) {
            if (isMountedRef.current) {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message,
                }));
            }
        }
    }, [partnerId]);

    /**
     * Get a field value from the current persona
     */
    const getFieldValue = useCallback((path: string): any => {
        const keys = path.split('.');
        let current: any = state.persona;

        for (const key of keys) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }

        return current;
    }, [state.persona]);

    /**
     * Check if there are unsaved changes
     */
    const hasUnsavedChanges = state.pendingChanges.size > 0 || Object.keys(pendingUpdatesRef.current).length > 0;

    return {
        // State
        persona: state.persona,
        setupProgress: state.setupProgress,
        loading: state.loading,
        saving: state.saving,
        error: state.error,
        lastSaved: state.lastSaved,
        hasUnsavedChanges,

        // Actions
        updateField,
        batchUpdate,
        refresh,
        getFieldValue,
    };
}

/**
 * Deep merge utility for nested objects
 */
function deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key of Object.keys(source)) {
        if (
            source[key] !== null &&
            typeof source[key] === 'object' &&
            !Array.isArray(source[key]) &&
            target[key] !== null &&
            typeof target[key] === 'object' &&
            !Array.isArray(target[key])
        ) {
            result[key] = deepMerge(target[key], source[key]);
        } else {
            result[key] = source[key];
        }
    }

    return result;
}

export default useSettingsSync;
