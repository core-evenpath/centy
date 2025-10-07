
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCcw, Send, Sparkles } from 'lucide-react';
import { CreateCampaignModal } from './CreateCampaignModal';

interface Recommendation {
  id: string;
  text: string;
  imageUrl: string;
}

interface RecommendedCampaignsProps {
  partnerId: string;
}

const recommendationPrompts = [
  { text: "A witty and engaging weekend promotion for a local coffee shop.", image: "A beautiful latte art in a cozy coffee shop setting." },
  { text: "An urgent alert for a hot new stock pick in the renewable energy sector.", image: "A dynamic image of a bull market chart with green arrows pointing up." },
  { text: "A friendly reminder about an upcoming real estate open house with a touch of luxury.", image: "A stunning modern house with a beautiful garden and a 'For Sale' sign." },
];

export default function RecommendedCampaigns({ partnerId }: RecommendedCampaignsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ message: string, mediaUrl: string } | null>(null);
  const { toast } = useToast();

  const generateRecommendations = async () => {
    setIsLoading(true);
    setRecommendations([]);

    try {
      const generatedRecommendations: Recommendation[] = await Promise.all(
        recommendationPrompts.map(async (prompt, index) => {
          const [textResponse, imageResponse] = await Promise.all([
            fetch('/api/generate-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: prompt.text })
            }).then(res => res.json()),
            fetch('/api/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: prompt.image })
            }).then(res => res.json())
          ]);

          if (textResponse.error || imageResponse.error) {
            throw new Error(textResponse.error || imageResponse.error || 'Failed to generate content');
          }

          return {
            id: `rec-${index}`,
            text: textResponse.content,
            imageUrl: imageResponse.imageUrl,
          };
        })
      );
      setRecommendations(generatedRecommendations);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to generate recommendations',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateRecommendations();
  }, []);

  const handleSendClick = (recommendation: Recommendation) => {
    setModalContent({ message: recommendation.text, mediaUrl: recommendation.imageUrl });
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Make it interesting</h3>
            </div>
            <Button variant="outline" size="sm" onClick={generateRecommendations} disabled={isLoading}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="overflow-hidden group">
                  <div className="relative h-32">
                    <img src={rec.imageUrl} alt="Campaign visual" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground h-20 line-clamp-4">{rec.text}</p>
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => handleSendClick(rec)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Campaign
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {modalContent && (
        <CreateCampaignModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            partnerId={partnerId}
            initialContent={modalContent}
        />
      )}
    </>
  );
}
