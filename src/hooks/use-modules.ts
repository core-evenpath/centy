'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
    SystemModule,
    ModuleAssignment,
    PartnerModule,
    ModuleItem,
    PaginatedResponse,
    MigrationPreview,
} from '@/lib/modules/types';
import {
    getSystemModulesAction,
    getSystemModuleAction,
    getModuleAssignmentsAction,
    getAvailableModulesForPartnerAction,
    getPartnerModulesAction,
    getPartnerModuleAction,
    getModuleItemsAction,
    getMigrationPreviewAction,
} from '@/actions/modules-actions';

export function useSystemModules() {
    const [modules, setModules] = useState<SystemModule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchModules = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const result = await getSystemModulesAction();
        if (result.success && result.data) {
            setModules(result.data);
        } else {
            setError(result.error || 'Failed to fetch modules');
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);

    return { modules, isLoading, error, refetch: fetchModules };
}

export function useSystemModule(moduleSlug: string) {
    const [module, setModule] = useState<SystemModule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!moduleSlug) return;

        const fetchModule = async () => {
            setIsLoading(true);
            setError(null);
            const result = await getSystemModuleAction(moduleSlug);
            if (result.success && result.data) {
                setModule(result.data);
            } else {
                setError(result.error || 'Failed to fetch module');
            }
            setIsLoading(false);
        };

        fetchModule();
    }, [moduleSlug]);

    return { module, isLoading, error };
}

export function useModuleAssignments(industryId?: string) {
    const [assignments, setAssignments] = useState<ModuleAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAssignments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const result = await getModuleAssignmentsAction(industryId);
        if (result.success && result.data) {
            setAssignments(result.data);
        } else {
            setError(result.error || 'Failed to fetch assignments');
        }
        setIsLoading(false);
    }, [industryId]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    return { assignments, isLoading, error, refetch: fetchAssignments };
}

export function useAvailableModules(partnerId: string) {
    const [modules, setModules] = useState<SystemModule[]>([]);
    const [assignment, setAssignment] = useState<ModuleAssignment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!partnerId) return;

        const fetchAvailable = async () => {
            setIsLoading(true);
            setError(null);
            const result = await getAvailableModulesForPartnerAction(partnerId);
            if (result.success && result.data) {
                setModules(result.data.modules);
                setAssignment(result.data.assignment);
            } else {
                setError(result.error || 'Failed to fetch available modules');
            }
            setIsLoading(false);
        };

        fetchAvailable();
    }, [partnerId]);

    return { modules, assignment, isLoading, error };
}

export function usePartnerModules(partnerId: string) {
    const [modules, setModules] = useState<PartnerModule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchModules = useCallback(async () => {
        if (!partnerId) return;

        setIsLoading(true);
        setError(null);
        const result = await getPartnerModulesAction(partnerId);
        if (result.success && result.data) {
            setModules(result.data);
        } else {
            setError(result.error || 'Failed to fetch partner modules');
        }
        setIsLoading(false);
    }, [partnerId]);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);

    return { modules, isLoading, error, refetch: fetchModules };
}

export function usePartnerModule(partnerId: string, moduleSlug: string) {
    const [partnerModule, setPartnerModule] = useState<PartnerModule | null>(null);
    const [systemModule, setSystemModule] = useState<SystemModule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchModule = useCallback(async () => {
        if (!partnerId || !moduleSlug) return;

        setIsLoading(true);
        setError(null);
        const result = await getPartnerModuleAction(partnerId, moduleSlug);
        if (result.success && result.data) {
            setPartnerModule(result.data.partnerModule);
            setSystemModule(result.data.systemModule);
        } else {
            setError(result.error || 'Failed to fetch module');
        }
        setIsLoading(false);
    }, [partnerId, moduleSlug]);

    useEffect(() => {
        fetchModule();
    }, [fetchModule]);

    return { partnerModule, systemModule, isLoading, error, refetch: fetchModule };
}

export function useModuleItems(
    partnerId: string,
    moduleId: string,
    options?: {
        category?: string;
        search?: string;
        isActive?: boolean;
        page?: number;
        pageSize?: number;
    }
) {
    const [data, setData] = useState<PaginatedResponse<ModuleItem> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
        if (!partnerId || !moduleId) return;

        setIsLoading(true);
        setError(null);
        const result = await getModuleItemsAction(partnerId, moduleId, options);
        if (result.success && result.data) {
            setData(result.data);
        } else {
            setError(result.error || 'Failed to fetch items');
        }
        setIsLoading(false);
    }, [partnerId, moduleId, options?.category, options?.search, options?.isActive, options?.page, options?.pageSize]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    return {
        items: data?.items || [],
        total: data?.total || 0,
        page: data?.page || 1,
        pageSize: data?.pageSize || 20,
        hasMore: data?.hasMore || false,
        isLoading,
        error,
        refetch: fetchItems
    };
}

export function useMigrationPreview(
    partnerId: string,
    moduleId: string,
    targetVersion: number | null
) {
    const [preview, setPreview] = useState<MigrationPreview | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!partnerId || !moduleId || !targetVersion) {
            setPreview(null);
            return;
        }

        const fetchPreview = async () => {
            setIsLoading(true);
            setError(null);
            const result = await getMigrationPreviewAction(partnerId, moduleId, targetVersion);
            if (result.success && result.data) {
                setPreview(result.data);
            } else {
                setError(result.error || 'Failed to get migration preview');
            }
            setIsLoading(false);
        };

        fetchPreview();
    }, [partnerId, moduleId, targetVersion]);

    return { preview, isLoading, error };
}
