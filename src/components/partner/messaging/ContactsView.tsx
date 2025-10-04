import React, { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Plus, Users, X, Upload, Lightbulb } from 'lucide-react';


const NewGroupModal = ({ setShowNewGroup }: { setShowNewGroup: (show: boolean) => void }) => {
    const [templateFields, setTemplateFields] = useState<any[]>([]);
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
                    <button onClick={() => setShowNewGroup(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function ContactsView() {
  const [showNewGroup, setShowNewGroup] = useState(false);
  const contacts = [
    { id: 1, name: 'Premium Members', count: 245, engagement: 89.3, revenue: 35647 },
    { id: 2, name: 'VIP Tier', count: 180, engagement: 94.1, revenue: 53775 },
    { id: 3, name: 'General List', count: 859, engagement: 76.8, revenue: 38823 }
  ];

  return (
    <>
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Contacts</h2>
            <p className="text-gray-500 mt-1">Organize and segment your subscriber base</p>
          </div>
          <Button onClick={() => setShowNewGroup(true)}>
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
    {showNewGroup && <NewGroupModal setShowNewGroup={setShowNewGroup} />}
    </>
  );
}
