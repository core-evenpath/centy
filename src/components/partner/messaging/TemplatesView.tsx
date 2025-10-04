import React, { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Plus, X, Trash2 } from 'lucide-react';

const NewTemplateModal = ({ setShowNewTemplate }: { setShowNewTemplate: (show: boolean) => void }) => {
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

export default function TemplatesView() {
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const templates = [
    { id: 1, name: 'Stock Pick Alert', icon: '📈', usage: 142, engagement: 87.3 },
    { id: 2, name: 'Quick Update', icon: '⚡', usage: 89, engagement: 92.1 },
    { id: 3, name: 'Market Analysis', icon: '📊', usage: 54, engagement: 91.2 }
  ];

  return (
    <>
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Templates</h2>
            <p className="text-gray-500 mt-1">Pre-built message templates for quick sending</p>
          </div>
          <Button onClick={() => setShowNewTemplate(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Template
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {templates.map(template => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-4xl">{template.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usage</span>
                    <span className="font-semibold text-gray-900">{template.usage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Engagement</span>
                    <span className="font-semibold text-green-600">{template.engagement}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
    {showNewTemplate && <NewTemplateModal setShowNewTemplate={setShowNewTemplate} />}
    </>
  );
}
