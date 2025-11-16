export const AI_MODEL_OPTIONS: AIModelOption[] = [
    {
      value: 'haiku',
      label: 'Claude Haiku 3.5',
      description: 'Fastest, Cheapest',
      costPerQuery: '$0.002',
      speed: 'Fast',
      quality: 'Good',
    },
    {
      value: 'sonnet-3.5',
      label: 'Claude Sonnet 3.5',
      description: 'Better Quality',
      costPerQuery: '$0.01',
      speed: 'Medium',
      quality: 'Better',
    },
    {
      value: 'sonnet-4.5',
      label: 'Claude Sonnet 4.5',
      description: 'Best Quality',
      costPerQuery: '$0.02',
      speed: 'Slow',
      quality: 'Best',
    },
    {
      value: 'gpt-4o-mini',
      label: 'GPT-4o Mini',
      description: 'Alternative',
      costPerQuery: '$0.003',
      speed: 'Fast',
      quality: 'Good',
    },
    {
      value: 'gemini-flash',
      label: 'Gemini 2.5 Pro', // UPDATED
      description: 'Free', // Or update to 'Google AI' if you prefer
      costPerQuery: 'Free',
      speed: 'Fast',
      quality: 'Better', // UPDATED - 2.5 Pro is better than Flash
    },
  ];