'use client';

import React, { useState } from 'react';
import {
    Package, UtensilsCrossed, Briefcase, Building, Zap, Link2,
    ChevronDown, Plus, Edit3, Trash2, Check, X, Settings,
    RefreshCw, AlertCircle, CheckCircle, Clock, LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessPersona } from '@/lib/business-persona-types';
import {
    getModulesForIndustry,
    type ModuleConfig,
    type ModulesConfig,
} from '@/lib/schemas';

// ===== MODULE ICON & COLOR MAPPINGS =====
const MODULE_ICONS: Record<string, LucideIcon> = {
    'menu': UtensilsCrossed,
    'products': Package,
    'services': Briefcase,
    'rooms': Building,
    'properties': Building,
    'integrations': Link2,
    'tools': Zap,
};

const MODULE_COLORS: Record<string, string> = {
    'menu': 'bg-orange-500',
    'products': 'bg-blue-500',
    'services': 'bg-purple-500',
    'rooms': 'bg-teal-500',
    'properties': 'bg-emerald-500',
    'integrations': 'bg-indigo-500',
    'tools': 'bg-pink-500',
};

// ===== STATUS BADGE =====
function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { bg: string; text: string; icon: LucideIcon }> = {
        'active': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
        'connected': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
        'syncing': { bg: 'bg-blue-100', text: 'text-blue-700', icon: RefreshCw },
        'pending': { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
        'error': { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
        'disconnected': { bg: 'bg-slate-100', text: 'text-slate-600', icon: X },
        'inactive': { bg: 'bg-slate-100', text: 'text-slate-600', icon: X },
    };

    const config = configs[status.toLowerCase()] || configs['inactive'];
    const Icon = config.icon;

    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", config.bg, config.text)}>
            <Icon className="w-3 h-3" />
            {status}
        </span>
    );
}

// ===== COLLAPSIBLE MODULE SECTION =====
function ModuleSection({
    title,
    icon: Icon,
    iconBg,
    children,
    defaultOpen = false,
    description,
    status,
    itemCount
}: {
    title: string;
    icon: LucideIcon;
    iconBg: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    description?: string;
    status?: string;
    itemCount?: number;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
            >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{title}</h3>
                        {status && <StatusBadge status={status} />}
                        {itemCount !== undefined && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                {itemCount} items
                            </span>
                        )}
                    </div>
                    {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
                </div>
                <ChevronDown className={cn(
                    "w-5 h-5 text-slate-400 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>
            {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                    {children}
                </div>
            )}
        </div>
    );
}

// ===== INVENTORY ITEM CARD =====
function InventoryItem({
    item,
    type,
    onEdit,
    onDelete
}: {
    item: any;
    type: 'menu' | 'product' | 'service' | 'room' | 'property';
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    const getItemDetails = () => {
        switch (type) {
            case 'menu':
                return {
                    name: item.name,
                    subtitle: item.category,
                    price: item.price ? `₹${item.price}` : undefined,
                    tags: [item.dietaryInfo?.type, item.isSpicy && 'Spicy', item.isRecommended && '⭐ Recommended'].filter(Boolean),
                };
            case 'product':
                return {
                    name: item.name,
                    subtitle: item.category,
                    price: item.price ? `₹${item.price}` : undefined,
                    tags: [item.isAvailable ? 'In Stock' : 'Out of Stock'],
                };
            case 'service':
                return {
                    name: item.name,
                    subtitle: item.category,
                    price: item.price ? `₹${item.price}` : (item.priceRange || undefined),
                    tags: [item.duration && `${item.duration} mins`].filter(Boolean),
                };
            case 'room':
                return {
                    name: item.name,
                    subtitle: `${item.maxOccupancy || 2} guests max`,
                    price: item.basePrice ? `₹${item.basePrice}/night` : undefined,
                    tags: item.amenities?.slice(0, 3) || [],
                };
            case 'property':
                return {
                    name: item.title || item.name,
                    subtitle: item.propertyType,
                    price: item.price ? `₹${item.price.toLocaleString()}` : undefined,
                    tags: [item.bedrooms && `${item.bedrooms} BHK`, item.area && `${item.area} sq.ft`].filter(Boolean),
                };
            default:
                return { name: item.name || 'Item', subtitle: '', price: undefined, tags: [] };
        }
    };

    const details = getItemDetails();

    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group">
            <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                {item.image ? (
                    <img src={item.image} alt={details.name} className="w-full h-full object-cover" />
                ) : (
                    <Package className="w-5 h-5 text-slate-300" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{details.name}</div>
                {details.subtitle && (
                    <div className="text-xs text-slate-500">{details.subtitle}</div>
                )}
                {details.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {details.tags.map((tag: string, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            {details.price && (
                <div className="text-sm font-semibold text-emerald-600">{details.price}</div>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-1.5 hover:bg-slate-200 rounded">
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button onClick={onDelete} className="p-1.5 hover:bg-red-100 rounded">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
            </div>
        </div>
    );
}

// ===== INTEGRATION CARD =====
function IntegrationCard({
    integration,
    onConnect,
    onDisconnect,
    onSettings
}: {
    integration: any;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onSettings?: () => void;
}) {
    const isConnected = integration.status === 'connected' || integration.status === 'active';

    return (
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                {integration.icon ? (
                    <img src={integration.icon} alt={integration.name} className="w-8 h-8" />
                ) : (
                    <Link2 className="w-5 h-5 text-slate-400" />
                )}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{integration.name}</span>
                    <StatusBadge status={integration.status || 'disconnected'} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{integration.description}</div>
            </div>
            <div className="flex gap-2">
                {isConnected ? (
                    <>
                        <button
                            onClick={onSettings}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <Settings className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                            onClick={onDisconnect}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Disconnect
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onConnect}
                        className="px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Connect
                    </button>
                )}
            </div>
        </div>
    );
}

// ===== TOOL CARD =====
function ToolCard({ tool }: { tool: any }) {
    return (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200">
            <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                tool.isEnabled ? "bg-indigo-500" : "bg-slate-300"
            )}>
                <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
                <div className="font-medium text-slate-900">{tool.name}</div>
                <div className="text-xs text-slate-500">{tool.description}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={tool.isEnabled} readOnly />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
    );
}

// ===== MAIN MODULES RENDERER =====
interface SchemaModulesRendererProps {
    persona: Partial<BusinessPersona>;
    industryId: string;
    onUpdate: (path: string, value: any) => Promise<void>;
}

export function SchemaModulesRenderer({ persona, industryId, onUpdate }: SchemaModulesRendererProps) {
    // Get modules configuration for this industry
    const modulesConfig = getModulesForIndustry(industryId);

    // Get inventory data from persona
    const menuItems = (persona as any)?.menuItems || [];
    const products = (persona as any)?.products || [];
    const services = (persona as any)?.services || [];
    const rooms = (persona as any)?.rooms || [];
    const properties = (persona as any)?.properties || [];

    // Mock integrations and tools for demo
    const integrations = [
        { id: 'whatsapp', name: 'WhatsApp Business', description: 'Send messages and manage conversations', status: 'connected', icon: '/icons/whatsapp.png' },
        { id: 'swiggy', name: 'Swiggy', description: 'Sync menu and manage orders', status: 'disconnected' },
        { id: 'zomato', name: 'Zomato', description: 'Sync menu and manage orders', status: 'disconnected' },
        { id: 'google', name: 'Google Business', description: 'Sync reviews and business info', status: 'pending' },
    ];

    const tools = [
        { id: 'ai-suggestions', name: 'AI Suggestions', description: 'Get smart reply suggestions for customer messages', isEnabled: true },
        { id: 'auto-responses', name: 'Auto Responses', description: 'Automatically respond to common queries', isEnabled: false },
        { id: 'smart-routing', name: 'Smart Routing', description: 'Route conversations to the right team member', isEnabled: true },
    ];

    return (
        <div className="space-y-4">
            {/* Inventory Module - Menu (F&B) */}
            {modulesConfig.inventory.type === 'menu' && (
                <ModuleSection
                    title="Menu Items"
                    icon={UtensilsCrossed}
                    iconBg="bg-orange-500"
                    defaultOpen={true}
                    description="Manage your restaurant menu items"
                    status={menuItems.length > 0 ? 'active' : 'inactive'}
                    itemCount={menuItems.length}
                >
                    <div className="space-y-3">
                        {menuItems.length > 0 ? (
                            menuItems.slice(0, 5).map((item: any, idx: number) => (
                                <InventoryItem key={idx} item={item} type="menu" />
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">No menu items yet</p>
                                <p className="text-sm">Add your first menu item or import from integrations</p>
                            </div>
                        )}
                        {menuItems.length > 5 && (
                            <button className="w-full py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg">
                                View all {menuItems.length} items →
                            </button>
                        )}
                        <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Menu Item
                        </button>
                    </div>
                </ModuleSection>
            )}

            {/* Inventory Module - Products (Retail) */}
            {modulesConfig.inventory.type === 'products' && (
                <ModuleSection
                    title="Products"
                    icon={Package}
                    iconBg="bg-blue-500"
                    defaultOpen={true}
                    description="Manage your product catalog"
                    status={products.length > 0 ? 'active' : 'inactive'}
                    itemCount={products.length}
                >
                    <div className="space-y-3">
                        {products.length > 0 ? (
                            products.slice(0, 5).map((item: any, idx: number) => (
                                <InventoryItem key={idx} item={item} type="product" />
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">No products yet</p>
                                <p className="text-sm">Add your first product or import from your store</p>
                            </div>
                        )}
                        <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Product
                        </button>
                    </div>
                </ModuleSection>
            )}

            {/* Inventory Module - Services */}
            {modulesConfig.inventory.type === 'services' && (
                <ModuleSection
                    title="Services"
                    icon={Briefcase}
                    iconBg="bg-purple-500"
                    defaultOpen={true}
                    description="Manage your service offerings"
                    status={services.length > 0 ? 'active' : 'inactive'}
                    itemCount={services.length}
                >
                    <div className="space-y-3">
                        {services.length > 0 ? (
                            services.slice(0, 5).map((item: any, idx: number) => (
                                <InventoryItem key={idx} item={item} type="service" />
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">No services yet</p>
                                <p className="text-sm">Add your service offerings</p>
                            </div>
                        )}
                        <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Service
                        </button>
                    </div>
                </ModuleSection>
            )}

            {/* Inventory Module - Rooms (Hospitality) */}
            {modulesConfig.inventory.type === 'rooms' && (
                <ModuleSection
                    title="Room Types"
                    icon={Building}
                    iconBg="bg-teal-500"
                    defaultOpen={true}
                    description="Manage your room inventory"
                    status={rooms.length > 0 ? 'active' : 'inactive'}
                    itemCount={rooms.length}
                >
                    <div className="space-y-3">
                        {rooms.length > 0 ? (
                            rooms.slice(0, 5).map((item: any, idx: number) => (
                                <InventoryItem key={idx} item={item} type="room" />
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Building className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">No room types yet</p>
                                <p className="text-sm">Add your room categories</p>
                            </div>
                        )}
                        <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Room Type
                        </button>
                    </div>
                </ModuleSection>
            )}

            {/* Inventory Module - Properties (Real Estate) */}
            {modulesConfig.inventory.type === 'properties' && (
                <ModuleSection
                    title="Property Listings"
                    icon={Building}
                    iconBg="bg-emerald-500"
                    defaultOpen={true}
                    description="Manage your property listings"
                    status={properties.length > 0 ? 'active' : 'inactive'}
                    itemCount={properties.length}
                >
                    <div className="space-y-3">
                        {properties.length > 0 ? (
                            properties.slice(0, 5).map((item: any, idx: number) => (
                                <InventoryItem key={idx} item={item} type="property" />
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Building className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">No listings yet</p>
                                <p className="text-sm">Add your property listings</p>
                            </div>
                        )}
                        <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Property
                        </button>
                    </div>
                </ModuleSection>
            )}

            {/* Integrations */}
            <ModuleSection
                title="Integrations"
                icon={Link2}
                iconBg="bg-indigo-500"
                description="Connect external services and platforms"
                status="active"
            >
                <div className="space-y-3">
                    {integrations.map((integration) => (
                        <IntegrationCard
                            key={integration.id}
                            integration={integration}
                            onConnect={() => console.log('Connect:', integration.name)}
                            onDisconnect={() => console.log('Disconnect:', integration.name)}
                            onSettings={() => console.log('Settings:', integration.name)}
                        />
                    ))}
                </div>
            </ModuleSection>

            {/* AI Tools */}
            <ModuleSection
                title="AI Tools"
                icon={Zap}
                iconBg="bg-pink-500"
                description="Configure AI-powered features"
            >
                <div className="space-y-3">
                    {tools.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                    ))}
                </div>
            </ModuleSection>
        </div>
    );
}

export default SchemaModulesRenderer;
