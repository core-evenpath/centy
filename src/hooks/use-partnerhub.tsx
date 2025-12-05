"use client";

// ============================================================================
// PARTNERHUB SHARED STATE HOOK
// React Context + hook for managing PartnerHub state with Firestore sync
// ============================================================================

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
    useMemo,
} from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    setDoc,
    Timestamp,
    where,
    limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useMultiWorkspaceAuth } from './use-multi-workspace-auth';
import {
    DocumentMetadata,
    ProcessingStatus,
    FileCategory,
    PartnerHubChatMessage,
    Thread,
    AgentProfile,
    ChatContext,
    ChatContextType,
    AgentType,
    Attachment,
    getFileCategory,
    generateId,
} from '@/lib/partnerhub-types';
import {
    processDocumentAction,
    generatePartnerHubResponseAction,
    createThreadAction,
    deleteThreadAction,
    deleteDocumentAction,
    addTagToDocumentAction,
    removeTagFromDocumentAction,
} from '@/actions/partnerhub-actions';

// ============================================================================
// SYSTEM AGENTS
// ============================================================================

const SYSTEM_AGENTS: AgentProfile[] = [
    {
        id: 'system-general',
        partnerId: 'system',
        name: 'General Assistant',
        description: 'A helpful AI assistant for general questions and tasks',
        avatar: '🤖',
        type: AgentType.SYSTEM,
        systemPrompt: 'You are a helpful AI assistant. Be concise, accurate, and friendly.',
        personality: {
            tone: 'friendly',
            style: 'balanced',
            traits: ['helpful', 'concise', 'accurate'],
        },
        capabilities: ['general-qa', 'summarization', 'writing'],
        knowledgeDocIds: [],
        isActive: true,
        isDefault: true,
        temperature: 0.7,
        maxTokens: 2048,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
    },
    {
        id: 'system-researcher',
        partnerId: 'system',
        name: 'Research Assistant',
        description: 'Specialized in deep research and analysis of documents',
        avatar: '🔬',
        type: AgentType.SYSTEM,
        systemPrompt: 'You are a research assistant. Analyze documents thoroughly and provide detailed, well-structured insights with citations.',
        personality: {
            tone: 'professional',
            style: 'detailed',
            traits: ['analytical', 'thorough', 'structured'],
        },
        capabilities: ['research', 'analysis', 'citations'],
        knowledgeDocIds: [],
        isActive: true,
        isDefault: false,
        temperature: 0.3,
        maxTokens: 4096,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
    },
    {
        id: 'system-writer',
        partnerId: 'system',
        name: 'Content Writer',
        description: 'Creative writing and content generation specialist',
        avatar: '✍️',
        type: AgentType.SYSTEM,
        systemPrompt: 'You are a creative content writer. Generate engaging, well-written content that matches the requested style and tone.',
        personality: {
            tone: 'casual',
            style: 'detailed',
            traits: ['creative', 'engaging', 'versatile'],
        },
        capabilities: ['writing', 'editing', 'brainstorming'],
        knowledgeDocIds: [],
        isActive: true,
        isDefault: false,
        temperature: 0.9,
        maxTokens: 4096,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
    },
];

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface PartnerHubContextType {
    // Documents
    documents: DocumentMetadata[];
    documentsLoading: boolean;
    filteredDocuments: DocumentMetadata[];

    // Threads
    threads: Thread[];
    threadsLoading: boolean;
    activeThreadId: string | null;
    setActiveThreadId: (id: string | null) => void;

    // Messages
    messages: PartnerHubChatMessage[];
    messagesLoading: boolean;

    // Agents
    agents: AgentProfile[];
    customAgents: AgentProfile[];
    agentsLoading: boolean;
    selectedAgentId: string;
    setSelectedAgentId: (id: string) => void;

    // Context
    activeContext: ChatContext | null;
    switchContext: (context: ChatContext) => void;

    // UI State
    isUploading: boolean;
    isGenerating: boolean;
    generationStatus: string;

    // Document Filters
    fileSearch: string;
    setFileSearch: (search: string) => void;
    categoryFilter: FileCategory | 'all';
    setCategoryFilter: (filter: FileCategory | 'all') => void;

    // Chat Search
    chatSearch: string;
    setChatSearch: (search: string) => void;

    // Actions
    uploadDocument: (file: File) => Promise<string | null>;
    deleteDocument: (id: string) => Promise<void>;
    addTagToDocument: (id: string, tag: string) => Promise<void>;
    removeTagFromDocument: (id: string, tag: string) => Promise<void>;
    sendMessage: (text: string, attachments?: Attachment[], options?: { isImageMode?: boolean; referenceImageUrl?: string }) => Promise<void>;
    partnerId: string | null;
    createNewThread: (title: string, contextType?: ChatContextType, contextId?: string) => Promise<string | null>;
    deleteThread: (id: string) => Promise<void>;
}

const PartnerHubContext = createContext<PartnerHubContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function PartnerHubProvider({ children }: { children: ReactNode }) {
    const { currentWorkspace, user } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId;
    const userId = user?.uid;

    // Documents state
    const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
    const [documentsLoading, setDocumentsLoading] = useState(true);

    // Threads state
    const [threads, setThreads] = useState<Thread[]>([]);
    const [threadsLoading, setThreadsLoading] = useState(true);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

    // Messages state
    const [messages, setMessages] = useState<PartnerHubChatMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);

    // Agents state
    const [customAgents, setCustomAgents] = useState<AgentProfile[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(true);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('system-general');

    // Context state
    const [activeContext, setActiveContext] = useState<ChatContext | null>(null);

    // UI state
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');

    // Filter state
    const [fileSearch, setFileSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'all'>('all');
    const [chatSearch, setChatSearch] = useState('');

    // ============================================================================
    // FIRESTORE SUBSCRIPTIONS
    // ============================================================================

    // Subscribe to documents
    useEffect(() => {
        if (!partnerId) {
            setDocuments([]);
            setDocumentsLoading(false);
            return;
        }

        setDocumentsLoading(true);
        const docsRef = collection(db, 'partners', partnerId, 'hubDocuments');
        const docsQuery = query(docsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            docsQuery,
            (snapshot) => {
                const docs = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as DocumentMetadata[];
                setDocuments(docs);
                setDocumentsLoading(false);
            },
            (error) => {
                console.error('Error fetching documents:', error);
                setDocumentsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [partnerId]);

    // Subscribe to threads
    useEffect(() => {
        if (!partnerId) {
            setThreads([]);
            setThreadsLoading(false);
            return;
        }

        setThreadsLoading(true);
        const threadsRef = collection(db, 'partners', partnerId, 'hubThreads');
        const threadsQuery = query(
            threadsRef,
            where('isActive', '==', true),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            threadsQuery,
            (snapshot) => {
                const threadsList = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Thread[];
                setThreads(threadsList);
                setThreadsLoading(false);
            },
            (error) => {
                console.error('Error fetching threads:', error);
                setThreadsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [partnerId]);

    // Subscribe to messages for active thread
    useEffect(() => {
        if (!partnerId || !activeThreadId) {
            setMessages([]);
            setMessagesLoading(false);
            return;
        }

        setMessagesLoading(true);
        const messagesRef = collection(
            db,
            'partners',
            partnerId,
            'hubThreads',
            activeThreadId,
            'messages'
        );
        const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(
            messagesQuery,
            (snapshot) => {
                const messagesList = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as PartnerHubChatMessage[];
                setMessages(messagesList);
                setMessagesLoading(false);
            },
            (error) => {
                console.error('Error fetching messages:', error);
                setMessagesLoading(false);
            }
        );

        return () => unsubscribe();
    }, [partnerId, activeThreadId]);

    // Subscribe to custom agents
    useEffect(() => {
        if (!partnerId) {
            setCustomAgents([]);
            setAgentsLoading(false);
            return;
        }

        setAgentsLoading(true);
        const agentsRef = collection(db, 'partners', partnerId, 'hubAgents');
        const agentsQuery = query(agentsRef, where('isActive', '==', true));

        const unsubscribe = onSnapshot(
            agentsQuery,
            (snapshot) => {
                const agentsList = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as AgentProfile[];
                setCustomAgents(agentsList);
                setAgentsLoading(false);
            },
            (error) => {
                console.error('Error fetching agents:', error);
                setAgentsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [partnerId]);

    // ============================================================================
    // DERIVED STATE
    // ============================================================================

    // All agents (system + custom)
    const agents = useMemo(() => [...SYSTEM_AGENTS, ...customAgents], [customAgents]);

    // Filtered documents
    const filteredDocuments = useMemo(() => {
        let filtered = documents;

        // Filter by category
        if (categoryFilter !== 'all') {
            filtered = filtered.filter((doc) => doc.category === categoryFilter);
        }

        // Filter by search
        if (fileSearch.trim()) {
            const searchLower = fileSearch.toLowerCase();
            filtered = filtered.filter(
                (doc) =>
                    doc.name.toLowerCase().includes(searchLower) ||
                    doc.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
                    doc.summary?.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [documents, categoryFilter, fileSearch]);

    // ============================================================================
    // ACTIONS
    // ============================================================================

    // Upload document
    const uploadDocument = useCallback(
        async (file: File): Promise<string | null> => {
            if (!partnerId || !userId) return null;

            setIsUploading(true);
            try {
                const documentId = generateId();
                const category = getFileCategory(file.type);

                // Upload to Firebase Storage
                const storagePath = `partners/${partnerId}/hubDocuments/${documentId}/${file.name}`;
                const storageRef = ref(storage, storagePath);
                await uploadBytes(storageRef, file);
                const storageUrl = await getDownloadURL(storageRef);

                // Create document record in Firestore
                const docRef = doc(db, 'partners', partnerId, 'hubDocuments', documentId);
                await setDoc(docRef, {
                    id: documentId,
                    partnerId,
                    name: file.name,
                    originalName: file.name,
                    mimeType: file.type,
                    size: file.size,
                    category,
                    storagePath,
                    storageUrl,
                    status: ProcessingStatus.PENDING,
                    tags: [],
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    uploadedBy: userId,
                });

                // Process document with AI (async)
                const reader = new FileReader();
                reader.onload = async () => {
                    const base64 = (reader.result as string).split(',')[1];
                    await processDocumentAction(partnerId, documentId, base64, file.type, file.name);
                };
                reader.readAsDataURL(file);

                return documentId;
            } catch (error) {
                console.error('Error uploading document:', error);
                return null;
            } finally {
                setIsUploading(false);
            }
        },
        [partnerId, userId]
    );

    // Delete document
    const deleteDocument = useCallback(
        async (id: string) => {
            if (!partnerId) return;
            await deleteDocumentAction(partnerId, id);
        },
        [partnerId]
    );

    // Add tag to document
    const addTagToDocument = useCallback(
        async (id: string, tag: string) => {
            if (!partnerId) return;
            await addTagToDocumentAction(partnerId, id, tag);
        },
        [partnerId]
    );

    // Remove tag from document
    const removeTagFromDocument = useCallback(
        async (id: string, tag: string) => {
            if (!partnerId) return;
            await removeTagFromDocumentAction(partnerId, id, tag);
        },
        [partnerId]
    );

    // Send message
    const sendMessage = useCallback(
        async (text: string, attachments?: Attachment[], options?: { isImageMode?: boolean; referenceImageUrl?: string }) => {
            if (!partnerId || !userId || !text.trim()) return;

            let threadId = activeThreadId;

            // Create new thread if none active
            if (!threadId) {
                const result = await createThreadAction(partnerId, {
                    title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                    contextType: 'agent',
                    contextId: selectedAgentId,
                    createdBy: userId,
                });
                if (result.success && result.threadId) {
                    threadId = result.threadId;
                    setActiveThreadId(threadId);
                } else {
                    console.error('Failed to create thread');
                    return;
                }
            }

            setIsGenerating(true);
            setGenerationStatus(options?.isImageMode
                ? (options.referenceImageUrl ? 'Editing image...' : 'Creating image...')
                : 'Thinking...');

            try {
                const result = await generatePartnerHubResponseAction(partnerId, threadId, text, {
                    agentId: selectedAgentId !== 'system-general' ? selectedAgentId : undefined,
                    isImageMode: options?.isImageMode,
                    referenceImageUrl: options?.referenceImageUrl,
                });

                if (!result.success) {
                    console.error('Message generation failed:', result.error);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            } finally {
                setIsGenerating(false);
                setGenerationStatus('');
            }
        },
        [partnerId, userId, activeThreadId, selectedAgentId]
    );

    // Create new thread
    const createNewThread = useCallback(
        async (
            title: string,
            contextType: ChatContextType = ChatContextType.AGENT,
            contextId?: string
        ): Promise<string | null> => {
            if (!partnerId || !userId) return null;

            const result = await createThreadAction(partnerId, {
                title,
                contextType,
                contextId: contextId || selectedAgentId,
                createdBy: userId,
            });

            if (result.success && result.threadId) {
                setActiveThreadId(result.threadId);
                return result.threadId;
            }
            return null;
        },
        [partnerId, userId, selectedAgentId]
    );

    // Delete thread
    const deleteThread = useCallback(
        async (id: string) => {
            if (!partnerId) return;
            await deleteThreadAction(partnerId, id);
            if (activeThreadId === id) {
                setActiveThreadId(null);
            }
        },
        [partnerId, activeThreadId]
    );

    // Switch context
    const switchContext = useCallback((context: ChatContext) => {
        setActiveContext(context);
        setActiveThreadId(null);
        setMessages([]);
    }, []);

    // ============================================================================
    // CONTEXT VALUE
    // ============================================================================

    const value: PartnerHubContextType = {
        documents,
        documentsLoading,
        filteredDocuments,
        threads,
        threadsLoading,
        activeThreadId,
        setActiveThreadId,
        messages,
        messagesLoading,
        agents,
        customAgents,
        agentsLoading,
        selectedAgentId,
        setSelectedAgentId,
        activeContext,
        switchContext,
        isUploading,
        isGenerating,
        generationStatus,
        fileSearch,
        setFileSearch,
        categoryFilter,
        setCategoryFilter,
        chatSearch,
        setChatSearch,
        uploadDocument,
        deleteDocument,
        addTagToDocument,
        removeTagFromDocument,
        sendMessage,
        partnerId: partnerId || null,
        createNewThread,
        deleteThread,
    };

    return (
        <PartnerHubContext.Provider value={value}>
            {children}
        </PartnerHubContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

export function usePartnerHub() {
    const context = useContext(PartnerHubContext);
    if (!context) {
        throw new Error('usePartnerHub must be used within a PartnerHubProvider');
    }
    return context;
}
