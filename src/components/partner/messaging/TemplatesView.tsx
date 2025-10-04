import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Plus } from 'lucide-react';

export default function TemplatesView() {
  const templates = [
    { id: 1, name: 'Stock Pick Alert', icon: '📈', usage: 142, engagement: 87.3 },
    { id: 2, name: 'Quick Update', icon: '⚡', usage: 89, engagement: 92.1 },
    { id: 3, name: 'Market Analysis', icon: '📊', usage: 54, engagement: 91.2 }
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Templates</h2>
            <p className="text-gray-500 mt-1">Pre-built message templates for quick sending</p>
          </div>
          <Button>
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
  );
}
