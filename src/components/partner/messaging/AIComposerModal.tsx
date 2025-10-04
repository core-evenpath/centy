import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Sparkles, Wand2, Send } from 'lucide-react';

export default function AIComposerModal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState('');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Composer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to send?
            </label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., 'Send an update about stock performance'"
              rows={3}
            />
          </div>

          {input && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Wand2 className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">AI Generated Message</h3>
              </div>
              <Textarea
                rows={8}
                defaultValue="Quick update: Stock has performed exceptionally well, showing a 15% increase."
                className="mb-4"
              />
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm">Regenerate</Button>
                <Button>Use This Message</Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-500">Est. reach: 245 subscribers</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
