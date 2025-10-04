import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Sparkles, Radio, MessageCircle, AlertCircle, Brain, TrendingUp, DollarSign } from 'lucide-react';
import AIComposerModal from './AIComposerModal';

export default function MessagingDashboard() {
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showAiComposer, setShowAiComposer] = useState(false);

  const activities = [
    {
      id: 1,
      type: 'live',
      title: 'Morning Stock Picks',
      status: 'broadcasting',
      recipients: 245,
      engagement: 89.3,
      timestamp: 'Live now',
    },
    {
      id: 2,
      type: 'reply',
      title: 'John Smith replied',
      message: 'Thanks for the stock pick! Already up 15%',
      timestamp: '2m ago',
    },
    {
      id: 3,
      type: 'urgent',
      title: '3 messages failed',
      description: 'Invalid phone numbers detected',
      timestamp: '8m ago',
    }
  ];

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'live': return <Radio className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'reply': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Activity Stream */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity Stream</h3>
          <div className="flex space-x-2">
            <Badge variant="default">All</Badge>
            <Badge variant="outline">Live</Badge>
            <Badge variant="outline">Replies</Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activities.map(activity => (
            <button
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
              className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 text-left transition-colors ${
                selectedActivity?.id === activity.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{activity.title}</h4>
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                  {activity.message && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{activity.message}</p>
                  )}
                  {activity.engagement && (
                    <span className="text-xs text-green-600 font-medium">{activity.engagement}% engaged</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedActivity ? (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getActivityIcon(selectedActivity.type)}
                  <h3 className="font-semibold text-gray-900">{selectedActivity.title}</h3>
                </div>
                <Button onClick={() => setShowAiComposer(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Compose
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-600">Activity details would appear here...</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select an activity</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Metrics */}
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto p-6 space-y-6">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">AI Insights</h3>
          </div>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <h4 className="font-semibold text-gray-900 text-sm mb-2">Optimal send time detected</h4>
              <p className="text-sm text-gray-600 mb-3">Your audience is 34% more engaged at 9:15 AM vs 9:00 AM</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">+34% engagement</span>
                <Button variant="link" size="sm">Apply →</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Live Metrics</h3>
          <div className="space-y-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Online Now</span>
                  <span className="text-2xl font-bold text-gray-900">245</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Engaged</span>
                  <span className="text-2xl font-bold text-green-600">89.3%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showAiComposer && (
        <AIComposerModal onClose={() => setShowAiComposer(false)} />
      )}
    </div>
  );
}
