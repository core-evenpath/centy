
'use client';

import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const marketingIdeas: { [key: string]: string[] } = {
  January: [
    "New Year, New Goals: Post about setting marketing objectives.",
    "Customer Spotlight: Feature a loyal customer.",
    "Behind the Scenes: Show your team planning for the year.",
    "Run a 'Blue Monday' promotion to cheer people up.",
  ],
  February: [
    "Valentine's Day Special Offer.",
    "Share love for your customers/product.",
    "Super Bowl related content.",
    "Employee Appreciation Day post.",
  ],
  March: [
    "Spring Forward: Launch a new product or feature.",
    "St. Patrick's Day themed campaign.",
    "Women's History Month: Highlight female leaders in your industry.",
    "First Day of Spring post.",
  ],
  // ... add ideas for all months
};

interface WeeklySocialCalendarProps {
  onIdeaClick: (idea: string) => void;
}

export default function WeeklySocialCalendar({ onIdeaClick }: WeeklySocialCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const ideasForMonth = marketingIdeas[currentMonthName] || marketingIdeas['January'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const handleIdeaClick = (idea: string) => {
    const ideaContent = idea.split(': ')[1] || idea;
    onIdeaClick(ideaContent);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border">
        <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Prev
            </Button>
            <h3 className="text-lg font-semibold">{currentMonthName} {currentDate.getFullYear()}</h3>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
            Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ideasForMonth.map((idea, index) => (
            <button 
              key={index} 
              onClick={() => handleIdeaClick(idea)}
              className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:shadow-sm border border-gray-200 text-left transition-all"
            >
                <div className="font-semibold text-sm mb-1">{idea.split(': ')[0]}</div>
                <p className="text-xs text-gray-600">{idea.split(': ')[1] || idea}</p>
            </button>
            ))}
        </div>
    </div>
  );
}

