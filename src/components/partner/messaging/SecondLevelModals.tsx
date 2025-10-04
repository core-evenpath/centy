// src/components/partner/messaging/SecondLevelModals.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Plus, Sparkles, MessageSquare, Users, Calendar, Check, X, CreditCard, Upload, Lightbulb, Trash2 } from 'lucide-react';

export const NewCampaignModal = ({ setShowNewCampaign }: { setShowNewCampaign: (show: boolean) => void }) => {
    const [campaignStep, setCampaignStep] = useState(1);
    const templates = [
      { id: 1, name: 'Stock Pick Alert', icon: '📈', category: 'Trading' },
      { id: 2, name: 'Quick Update', icon: '⚡', category: 'General' },
      { id: 3, name: 'Market Analysis', icon: '📊', category: 'Analysis' }
    ];
    const contacts = [
      { id: 1, name: 'Premium Members', count: 245, engagement: 89.3 },
      { id: 2, name: 'VIP Tier', count: 180, engagement: 94.1 },
      { id: 3, name: 'General List', count: 859, engagement: 76.8 }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Create New Campaign</h2>
                            <p className="text-sm text-gray-500">Step {campaignStep} of 4</p>
                        </div>
                        <button onClick={() => setShowNewCampaign(false)}>
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </div>
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        {[
                            { id: 1, name: 'Template', icon: Sparkles },
                            { id: 2, name: 'Content', icon: MessageSquare },
                            { id: 3, name: 'Audience', icon: Users },
                            { id: 4, name: 'Schedule', icon: Calendar }
                        ].map((step, idx) => {
                            const Icon = step.icon;
                            return (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${campaignStep === step.id ? 'bg-blue-600 text-white' : campaignStep > step.id ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        {campaignStep > step.id ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-gray-700">{step.name}</span>
                                    {idx < 3 && <div className="flex-1 h-1 mx-4 bg-gray-200" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {campaignStep === 1 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {templates.map(template => (
                                    <button key={template.id} className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                                        <span className="text-4xl mb-3 block">{template.icon}</span>
                                        <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                                        <p className="text-xs text-gray-500">{template.category}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {campaignStep === 2 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customize Content</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                                    <input type="text" placeholder="e.g., Morning Stock Picks - Oct 2025" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                                    <textarea rows={8} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                </div>
                                <button className="flex items-center space-x-2 text-purple-600 hover:text-purple-700">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-sm font-medium">Use AI to improve</span>
                                </button>
                            </div>
                        </div>
                    )}
                    {campaignStep === 3 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Audience</h3>
                            <div className="space-y-3">
                                {contacts.map(contact => (
                                    <label key={contact.id} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                                        <div className="ml-4 flex-1">
                                            <p className="font-semibold text-gray-900">{contact.name}</p>
                                            <p className="text-sm text-gray-500">{contact.count} subscribers</p>
                                        </div>
                                        <span className="text-sm text-green-600 font-medium">{contact.engagement}%</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    {campaignStep === 4 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Campaign</h3>
                            <div className="space-y-4">
                                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer">
                                    <input type="radio" name="schedule" className="mt-1" />
                                    <div className="ml-4">
                                        <p className="font-semibold text-gray-900">Send Immediately</p>
                                        <p className="text-sm text-gray-500">Message will be sent right away</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer">
                                    <input type="radio" name="schedule" className="mt-1" />
                                    <div className="ml-4 flex-1">
                                        <p className="font-semibold text-gray-900 mb-2">Schedule for Later</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg" />
                                            <input type="time" className="px-3 py-2 border border-gray-300 rounded-lg" />
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                    <button onClick={() => setCampaignStep(Math.max(1, campaignStep - 1))} disabled={campaignStep === 1} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">Back</button>
                    <button onClick={() => campaignStep < 4 ? setCampaignStep(campaignStep + 1) : setShowNewCampaign(false)} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{campaignStep === 4 ? 'Launch Campaign' : 'Continue'}</button>
                </div>
            </div>
        </div>
    );
};

export const NewTemplateModal = ({ setShowNewTemplate }: { setShowNewTemplate: (show: boolean) => void }) => {
    const [templateFields, setTemplateFields] = useState<any[]>([]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Template</h2>
                    <button onClick={() => setShowNewTemplate(false)}>
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6 p-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                                <input type="text" placeholder="e.g., Stock Alert Pro" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
                                    <option>Trading & Investment</option>
                                    <option>Real Estate</option>
                                    <option>Marketing</option>
                                    <option>Custom</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Icon/Emoji</label>
                                <input type="text" placeholder="📈" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Template Fields</label>
                                    <button onClick={() => setTemplateFields([...templateFields, { name: '', label: '', type: 'text' }])} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add Field</button>
                                </div>
                                <div className="space-y-3">
                                    {templateFields.map((field, idx) => (
                                        <div key={idx} className="flex items-center space-x-2">
                                            <input type="text" placeholder="Field name" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                                <option>Text</option>
                                                <option>Number</option>
                                                <option>Select</option>
                                            </select>
                                            <button onClick={() => setTemplateFields(templateFields.filter((_, i) => i !== idx))} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Template Content</label>
                                <textarea rows={10} placeholder="Use {{fieldName}} for variables" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-mono text-sm" />
                            </div>
                        </div>
                        <div>
                            <div className="sticky top-0">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Live Preview</label>
                                <div className="bg-gray-900 rounded-2xl p-4">
                                    <div className="bg-white rounded-xl p-4">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                            <p className="text-sm font-semibold text-gray-900">Preview</p>
                                        </div>
                                        <div className="p-4">
                                            <div className="bg-blue-100 rounded-xl rounded-tl-none p-4">
                                                <p className="text-sm text-gray-900 whitespace-pre-line">Your message preview will appear here...</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button onClick={() => setShowNewTemplate(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Template</button>
                </div>
            </div>
        </div>
    );
};

export const NewGroupModal = ({ setShowNewGroup }: { setShowNewGroup: (show: boolean) => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Create Contact Group</h2>
                    <button onClick={() => setShowNewGroup(false)}>
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                        <input type="text" placeholder="e.g., VIP Members" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea rows={3} placeholder="Brief description of this group..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {['premium', 'active', 'high-engagement', 'vip'].map(tag => (
                                <button key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
                                    {tag} <X className="w-3 h-3 inline ml-1" />
                                </button>
                            ))}
                        </div>
                        <input type="text" placeholder="Add tag..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Import Contacts</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 mb-2">Drop CSV file or click to upload</p>
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Browse Files
                            </button>
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">Pro Tip</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    You can also add contacts manually after creating the group, or import from integrations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button onClick={() => setShowNewGroup(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Group</button>
                </div>
            </div>
        </div>
    );
};
