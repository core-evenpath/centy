import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Plus, Users } from 'lucide-react';

export default function ContactsView() {
  const contacts = [
    { id: 1, name: 'Premium Members', count: 245, engagement: 89.3, revenue: 35647 },
    { id: 2, name: 'VIP Tier', count: 180, engagement: 94.1, revenue: 53775 },
    { id: 3, name: 'General List', count: 859, engagement: 76.8, revenue: 38823 }
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Contacts</h2>
            <p className="text-gray-500 mt-1">Organize and segment your subscriber base</p>
          </div>
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            New Group
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {contacts.map(contact => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                    <p className="text-sm text-gray-500">{contact.count} subscribers</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Engagement</span>
                    <span className="font-semibold text-green-600">{contact.engagement}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue</span>
                    <span className="font-semibold text-gray-900">${contact.revenue}</span>
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
