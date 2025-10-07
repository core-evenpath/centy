
"use client";

import React, { useState } from 'react';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import { 
  MessageCircle, Users, FileText, Send, X, Sparkles, ChevronRight, 
  Smartphone, Check, Plus, ArrowRight, AlertCircle, Eye, Info, TrendingUp,
  Zap, Clock, HelpCircle, Copy, Edit, Trash2
} from 'lucide-react';
import contactGroupsData from '@/lib/contact-groups.json';

function MessagingPlatform() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [sendStep, setSendStep] = useState(1);
  const [messageType, setMessageType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateVariables, setTemplateVariables] = useState<any>({});
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('whatsapp');
  const [showHelp, setShowHelp] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [templateDescription, setTemplateDescription] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [picks, setPicks] = useState([
    { id: 1, name: 'Tesla Rec', ticker: 'TSLA', category: 'Tech', confidence: '85%', validFrom: 'June 3rd', validTo: '21st', summary: 'Strong buy recommendation for Tesla based on Q2 earnings.' },
    { id: 2, name: 'Index for June 2nd week', ticker: 'SPX', category: 'Index', confidence: '75%', validFrom: 'June 10th', validTo: '20th', summary: 'Market index showing positive momentum.' },
    { id: 3, name: 'June Commodities', ticker: 'GOLD', category: 'Commodities', confidence: '70%', validFrom: 'June', validTo: 'June', summary: 'Gold prices expected to rise.' }
  ]);
  const [newPick, setNewPick] = useState({
    name: '',
    ticker: '',
    category: '',
    confidence: '',
    validFrom: '',
    validTo: '',
    summary: ''
  });
  const [selectedPicks, setSelectedPicks] = useState<number[]>([]);

  const templates = [
    { 
      id: 1, 
      name: 'Stock Alert', 
      category: 'Trading',
      icon: TrendingUp,
      description: 'Notify customers when a stock price moves significantly',
      content: 'Hi {{name}}! BREAKING: {{stock}} just moved {{percentage}}. Check it out!',
      variables: ['name', 'stock', 'percentage'],
      example: 'Hi John! BREAKING: AAPL just moved +15%. Check it out!',
      whenToUse: 'When you need to alert clients about important stock movements',
      variableHelp: {
        stock: 'Stock ticker symbol (e.g., AAPL, TSLA)',
        percentage: 'Price change with + or - (e.g., +15%, -8%)'
      }
    },
    { 
      id: 2, 
      name: 'Market Update', 
      category: 'Trading',
      icon: TrendingUp,
      description: 'Share daily market insights and analysis',
      content: 'Good morning {{name}}! Here is the market analysis: {{analysis}}',
      variables: ['name', 'analysis'],
      example: 'Good morning Sarah! Here is the market analysis: Tech sector showing strong momentum today.',
      whenToUse: 'For daily market summaries or weekly analysis reports',
      variableHelp: {
        analysis: 'Your market insight or analysis (1-2 sentences)'
      }
    },
    { 
      id: 3, 
      name: 'Quick News',
      category: 'General',
      icon: Zap,
      description: 'Send breaking news or urgent updates',
      content: 'Hey {{name}}, quick update: {{news}}',
      variables: ['name', 'news'],
      example: 'Hey Mike, quick update: New trading platform features are now live!',
      whenToUse: 'When you have breaking news or important announcements',
      variableHelp: {
        news: 'Your news or update (keep it brief)'
      }
    },
    { 
      id: 4, 
      name: 'Weekly Report',
      category: 'Reports',
      icon: FileText,
      description: 'Send weekly performance summaries to clients',
      content: 'Hi {{name}}, here is your weekly report: {{summary}}. Questions? Reply anytime.',
      variables: ['name', 'summary'],
      example: 'Hi Lisa, here is your weekly report: Portfolio up 8.5% this week. Questions? Reply anytime.',
      whenToUse: 'For weekly or monthly performance reports',
      variableHelp: {
        summary: 'Brief performance summary with key numbers'
      }
    },
    { 
      id: 5, 
      name: 'Trading Pick',
      category: 'Trading Picks',
      icon: TrendingUp,
      description: 'Share trading recommendations with clients',
      content: 'Hi {{name}}! New trading pick: {{pickName}}. Ticker: {{ticker}}. Valid: {{validFrom}} - {{validTo}}. Confidence: {{confidence}}. {{summary}}',
      variables: ['name', 'pickName', 'ticker', 'validFrom', 'validTo', 'confidence', 'summary'],
      example: 'Hi John! New trading pick: Tesla Recommendation. Ticker: TSLA. Valid: June 3rd - 21st. Confidence: 85%. Strong buy based on Q2 earnings and market momentum.',
      whenToUse: 'When sharing trading picks and recommendations with your clients',
      variableHelp: {
        pickName: 'Name of your trading pick',
        ticker: 'Stock ticker symbol (e.g., AAPL, TSLA)',
        validFrom: 'Start date of the pick validity',
        validTo: 'End date of the pick validity',
        confidence: 'Your confidence level (e.g., 85%)',
        summary: 'Brief summary of your recommendation'
      }
    }
  ];

  const groups = contactGroupsData;

  const messageTypes = [
    { id: 'pick', label: 'Trading Pick', icon: TrendingUp, desc: 'Share trading recommendations' },
    { id: 'stock', label: 'Stock Alert', icon: TrendingUp, desc: 'Price movements & trading alerts' },
    { id: 'market', label: 'Market Update', icon: TrendingUp, desc: 'Daily market insights' },
    { id: 'news', label: 'Quick News', icon: Zap, desc: 'Breaking news & announcements' },
    { id: 'report', label: 'Weekly Report', icon: FileText, desc: 'Performance summaries' }
  ];

  const resetSendFlow = () => {
    setSendStep(1);
    setMessageType('');
    setSelectedTemplate(null);
    setTemplateVariables({});
    setSelectedGroups([]);
    setSelectedChannel('whatsapp');
  };

  const getAllTemplates = () => {
    return [...templates, ...customTemplates];
  };

  const duplicateTemplate = (template: any) => {
    const newTemplate = {
      ...template,
      id: Date.now(),
      name: `${template.name} (Copy)`,
      isCustom: true,
      originalId: template.id
    };
    setCustomTemplates([...customTemplates, newTemplate]);
    setEditingTemplate(newTemplate);
    setShowTemplateEditor(true);
    setShowManualForm(true); // Show form directly when duplicating
    setTemplateDescription('');
    showToast('Template duplicated - customize it now!');
  };

  const saveTemplate = (templateData: any) => {
    if ((editingTemplate as any).isCustom) {
      const existingIndex = customTemplates.findIndex(t => t.id === (editingTemplate as any).id);
      if (existingIndex >= 0) {
        setCustomTemplates(customTemplates.map(t => 
          t.id === (editingTemplate as any).id ? { ...t, ...templateData } : t
        ));
        showToast('Template updated successfully');
      } else {
        setCustomTemplates([...customTemplates, { ...editingTemplate, ...templateData }]);
        showToast('Template created successfully');
      }
    }
    setShowTemplateEditor(false);
    setEditingTemplate(null);
  };

  const deleteTemplate = (templateId: number) => {
    if (confirm('Delete this custom template? This cannot be undone.')) {
      setCustomTemplates(customTemplates.filter(t => t.id !== templateId));
      showToast('Template deleted');
    }
  };

  const editTemplate = (template: any) => {
    setEditingTemplate(template);
    setShowTemplateEditor(true);
    setShowManualForm(true); // Show form directly when editing existing templates
    setTemplateDescription('');
  };

  const createNewTemplate = () => {
    setTemplateDescription('');
    setShowManualForm(false);
    const newTemplate = {
      id: Date.now(),
      name: 'New Template',
      category: 'Custom',
      icon: Sparkles,
      description: 'Describe your template',
      content: 'Hi {{name}}, ',
      variables: ['name'],
      example: 'Example of your message',
      whenToUse: 'When you want to...',
      isCustom: true
    };
    setEditingTemplate(newTemplate);
    setShowTemplateEditor(true);
  };

  const generateTemplateFromDescription = () => {
    if (!templateDescription.trim()) {
      showToast('Please describe your template');
      return;
    }
    
    // In production, this would call an LLM API
    // For now, we'll create a basic template structure
    const generatedTemplate = {
      ...editingTemplate,
      name: 'Generated Template',
      description: templateDescription,
      content: 'Hi {{name}}, ' + templateDescription,
      example: 'Example based on: ' + templateDescription,
      whenToUse: 'For: ' + templateDescription
    };
    
    setEditingTemplate(generatedTemplate as any);
    setShowManualForm(true);
    showToast('Template generated! Review and customize below');
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const savePick = () => {
    if (!newPick.name || !newPick.ticker || !newPick.summary) {
      showToast('Please fill in all required fields');
      return;
    }
    const pick = {
      id: Date.now(),
      ...newPick
    };
    setPicks([...picks, pick]);
    setNewPick({
      name: '',
      ticker: '',
      category: '',
      confidence: '',
      validFrom: '',
      validTo: '',
      summary: ''
    });
    showToast('Pick saved successfully');
  };

  const sendPickMessage = (pick: any) => {
    const tradingPickTemplate = templates.find(t => t.id === 5);
    setSelectedTemplate(tradingPickTemplate as any);
    
    const initialVars = {
      name: '',
      pickName: pick.name,
      ticker: pick.ticker,
      validFrom: pick.validFrom,
      validTo: pick.validTo,
      confidence: pick.confidence,
      summary: pick.summary
    };
    setTemplateVariables(initialVars);
    setSendStep(2);
    setCurrentScreen('send');
  };

  const extractVariables = (content: string) => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const selectMessageType = (type: string) => {
    setMessageType(type);
    const allTemplates = getAllTemplates();
    const template: any = allTemplates.find(t => 
      t.name.toLowerCase().includes(type) || 
      t.category.toLowerCase().includes(type)
    ) || allTemplates[0];
    
    setSelectedTemplate(template);
    const initialVars: any = {};
    template.variables.forEach((v: string) => {
      initialVars[v] = '';
    });
    setTemplateVariables(initialVars);
    setSendStep(2);
  };

  const previewMessage = () => {
    if (!selectedTemplate) return '';
    let message = (selectedTemplate as any).content;
    Object.keys(templateVariables).forEach(key => {
      const value = (templateVariables as any)[key] || `[${key}]`;
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return message;
  };

  const allVariablesFilled = () => {
    if (!selectedTemplate) return false;
    return (selectedTemplate as any).variables
      .filter((v: string) => v !== 'name')
      .every((v: string) => (templateVariables as any)[v] && (templateVariables as any)[v].toString().trim() !== '');
  };

  const getTotalRecipients = () => {
    return groups.filter(g => selectedGroups.includes(g.id)).reduce((sum, g) => sum + g.count, 0);
  };

  const Toast = () => {
    if (!toast) return null;
    
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-400" />
          <span className="font-medium">{toast}</span>
        </div>
      </div>
    );
  };

  const ProgressStepper = () => {
    const steps = [
      { num: 1, label: 'Choose Type' },
      { num: 2, label: 'Add Details' },
      { num: 3, label: 'Select Contacts' },
      { num: 4, label: 'Review & Send' }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                sendStep >= step.num 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {sendStep > step.num ? <Check className="w-5 h-5" /> : step.num}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                sendStep >= step.num ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-12 h-1 mx-4 rounded ${
                sendStep > step.num ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (currentScreen === 'home') {
    return (
      <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
        <Toast />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 space-y-3">
            <button
              onClick={() => {
                resetSendFlow();
                setCurrentScreen('send');
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all mb-6 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-bold text-white mb-1">Send New Campaign</h2>
                    <p className="text-blue-100 text-sm">Create and send messages in 4 simple steps</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentScreen('templates')}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-purple-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <FileText className="w-10 h-10 text-purple-600" />
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                    {templates.length + customTemplates.length} TOTAL
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                  Message Templates
                </h3>
                <p className="text-gray-600 text-sm">
                  {customTemplates.length > 0 
                    ? `${templates.length} default + ${customTemplates.length} custom`
                    : 'Browse pre-written messages you can customize'
                  }
                </p>
              </button>

              <button
                onClick={() => setCurrentScreen('groups')}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-green-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Users className="w-10 h-10 text-green-600" />
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    {groups.reduce((sum, g) => sum + g.count, 0)} CONTACTS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                  Contact Groups
                </h3>
                <p className="text-gray-600 text-sm">View and manage your contact lists</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'send') {
    return (
      <>
        <Toast />
        <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Send Campaign</h1>
                  <p className="text-sm text-gray-600">Follow the steps below</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Leave without sending? Your progress will be lost.')) {
                      resetSendFlow();
                      setCurrentScreen('home');
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <div className="max-w-4xl mx-auto p-4 space-y-3">
                <ProgressStepper />
                
                {sendStep === 1 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">What do you want to send?</h2>
                      <p className="text-gray-600">Describe your message and we'll help you create it</p>
                    </div>

                    <div className="mb-8">
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        Describe your message
                      </label>
                      <textarea
                        value={messageType}
                        onChange={(e) => setMessageType(e.target.value)}
                        placeholder="Example: I want to share my latest trading pick for Tesla with a buy recommendation valid until end of month..."
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base resize-none"
                      />
                      <button
                        onClick={() => {
                          if (messageType.trim()) {
                            // Use AI approach - for now just move to step 2 with a generic template
                            const template = templates[0];
                            setSelectedTemplate(template);
                            const initialVars: any = {};
                            template.variables.forEach((v: string) => {
                              initialVars[v] = '';
                            });
                            setTemplateVariables(initialVars);
                            setSendStep(2);
                          }
                        }}
                        disabled={!messageType.trim()}
                        className="mt-4 w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Generate Message →
                      </button>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Or start from a template</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {messageTypes.map(type => (
                          <button
                            key={type.id}
                            onClick={() => selectMessageType(type.id)}
                            className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                          >
                            <type.icon className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                            <h3 className="text-base font-bold text-gray-900 mb-1">{type.label}</h3>
                            <p className="text-xs text-gray-600">{type.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {customTemplates.length > 0 && (
                      <div className="border-t border-gray-200 pt-6 mt-6">
                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">Your Custom Templates</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {customTemplates.map((template: any) => (
                            <button
                              key={template.id}
                              onClick={() => {
                                setSelectedTemplate(template);
                                const initialVars: any = {};
                                template.variables.forEach((v: string) => {
                                  initialVars[v] = '';
                                });
                                setTemplateVariables(initialVars);
                                setSendStep(2);
                              }}
                              className="p-4 border-2 border-blue-200 bg-blue-50 rounded-xl hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
                            >
                              <div className="flex items-center space-x-3">
                                <template.icon className="w-8 h-8 text-blue-600" />
                                <div>
                                  <h4 className="font-bold text-gray-900 text-sm">{template.name}</h4>
                                  <p className="text-xs text-gray-600">{template.category}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                      <div className="flex items-start space-x-3">
                        <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900 mb-1">How it works</p>
                          <p className="text-sm text-blue-800">
                            Describe what you want to send, or choose a pre-made template. We'll help you customize it in the next step.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {sendStep === 2 && selectedTemplate && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-2xl font-bold text-gray-900">Customize Your Message</h2>
                        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                          {(selectedTemplate as any).name}
                        </div>
                      </div>
                      <p className="text-gray-600">
                        Fill in the details below. Contact names will be added automatically from your list.
                      </p>
                    </div>

                    <div className="space-y-5 mb-6">
                      {(selectedTemplate as any).variables
                        .filter((v: string) => v !== 'name')
                        .map((variable: string) => (
                          <div key={variable}>
                            <label className="block text-sm font-bold text-gray-900 mb-2 capitalize flex items-center">
                              {variable}
                              {(selectedTemplate as any).variableHelp && (selectedTemplate as any).variableHelp[variable] && (
                                <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {(selectedTemplate as any).variableHelp[variable]}
                                </span>
                              )}
                            </label>
                            <input
                              type="text"
                              placeholder={`e.g., ${(selectedTemplate as any).variableHelp?.[variable] || `Enter ${variable}...`}`}
                              value={(templateVariables as any)[variable] || ''}
                              onChange={(e) => setTemplateVariables({
                                ...templateVariables,
                                [variable]: e.target.value
                              })}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base"
                            />
                          </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
                      <div className="flex items-start space-x-3 mb-3">
                        <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-blue-900">Live Preview</p>
                      </div>
                      <p className="text-base text-gray-900 leading-relaxed">{previewMessage()}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        onClick={() => setSendStep(1)}
                        className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setSendStep(3)}
                        disabled={!allVariablesFilled()}
                        className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next: Choose Who Receives It →
                      </button>
                    </div>
                  </div>
                )}

                {sendStep === 3 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Who should receive this message?</h2>
                      <p className="text-gray-600">Select one or more contact groups (you can select multiple)</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {groups.map(group => (
                        <label
                          key={group.id}
                          className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedGroups.includes(group.id)
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow'
                          }`}
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedGroups.includes(group.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGroups([...selectedGroups, group.id]);
                                } else {
                                  setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                                }
                              }}
                              className="w-6 h-6 text-blue-600 rounded border-2 border-gray-300"
                            />
                          </div>
                          <div className="ml-4 flex-1">
                            <p className="text-lg font-bold text-gray-900">{group.name}</p>
                            <p className="text-sm text-gray-600">{group.description}</p>
                          </div>
                          <div className="text-right bg-white rounded-lg px-4 py-2">
                            <p className="text-2xl font-bold text-gray-900">{group.count}</p>
                            <p className="text-xs text-gray-500 uppercase font-medium">contacts</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {selectedGroups.length > 0 ? (
                      <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5 mb-6">
                        <div className="flex items-center space-x-3">
                          <Check className="w-6 h-6 text-green-600" />
                          <p className="text-lg font-bold text-green-900">
                            Ready to send to {getTotalRecipients()} contacts
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 mb-6">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="w-6 h-6 text-yellow-600" />
                          <p className="text-sm font-semibold text-yellow-900">
                            Please select at least one contact group to continue
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        onClick={() => setSendStep(2)}
                        className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setSendStep(4)}
                        disabled={selectedGroups.length === 0}
                        className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next: Review & Send →
                      </button>
                    </div>
                  </div>
                )}

                {sendStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Before Sending</h2>
                      <p className="text-gray-600 mb-6">Double-check everything looks correct</p>

                      <div className="space-y-4 mb-8">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Your Message</p>
                            <button
                              onClick={() => setSendStep(2)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-lg text-gray-900 leading-relaxed">{previewMessage()}</p>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Recipients</p>
                            <button
                              onClick={() => setSendStep(3)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-lg font-bold text-gray-900 mb-1">
                            {groups.filter(g => selectedGroups.includes(g.id)).map(g => g.name).join(', ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-bold text-gray-900">{getTotalRecipients()}</span> contacts will receive this message
                          </p>
                        </div>
                      </div>

                      <div className="mb-8">
                        <p className="text-lg font-bold text-gray-900 mb-4">Choose How to Send</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button
                            onClick={() => setSelectedChannel('whatsapp')}
                            className={`p-6 border-2 rounded-xl transition-all ${
                              selectedChannel === 'whatsapp'
                                ? 'border-green-500 bg-green-50 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                            <p className="font-bold text-gray-900 text-lg mb-1">WhatsApp</p>
                            <p className="text-sm text-gray-600">Higher engagement rates</p>
                          </button>

                          <button
                            onClick={() => setSelectedChannel('sms')}
                            className={`p-6 border-2 rounded-xl transition-all ${
                              selectedChannel === 'sms'
                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Smartphone className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                            <p className="font-bold text-gray-900 text-lg mb-1">SMS</p>
                            <p className="text-sm text-gray-600">Universal compatibility</p>
                          </button>
                        </div>
                      </div>

                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
                        <div className="flex items-start space-x-3">
                          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-blue-900 mb-1">Messages will be sent immediately</p>
                            <p className="text-sm text-blue-800">
                              Your campaign will start sending to all {getTotalRecipients()} contacts within seconds
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                          onClick={() => setSendStep(3)}
                          className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Send to ${getTotalRecipients()} contacts via ${selectedChannel}?`)) {
                              alert(`Campaign sent successfully to ${getTotalRecipients()} contacts via ${selectedChannel}!`);
                              resetSendFlow();
                              setCurrentScreen('home');
                            }
                          }}
                          className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3"
                        >
                          <Send className="w-5 h-5" />
                          <span>Send Campaign Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentScreen === 'templates') {
    const allTemplates = getAllTemplates();
    const defaultTemplates = templates;
    const userTemplates = customTemplates;

    return (
      <>
        <Toast />
        <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 space-y-3">
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
                        <p className="text-sm text-muted-foreground mt-1">Pre-written messages that save you time</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={createNewTemplate}
                            className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Create New</span>
                        </Button>
                        <Button
                            onClick={() => setCurrentScreen('home')}
                            variant="outline"
                        >
                            ← Back
                        </Button>
                    </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-3">
                  {userTemplates.length > 0 ? (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">Your Custom Templates</h2>
                          <p className="text-sm text-gray-600">Templates you've created</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                          {userTemplates.length} custom
                        </span>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {userTemplates.map((template: any) => (
                          <div key={template.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border-2 border-blue-200 p-6 hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                  <template.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                                  <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full font-medium">
                                    Custom
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-700 mb-4">{template.description}</p>

                            <div className="bg-white border border-blue-200 rounded-xl p-4 mb-4">
                              <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Example:</p>
                              <p className="text-sm text-gray-900">{template.example}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => editTemplate(template)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-2"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => deleteTemplate(template.id)}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 sm:p-12 mb-8 text-center">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Create Your First Custom Template</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Start from scratch or duplicate one of our default templates below and customize it to your needs
                      </p>
                      <button
                        onClick={createNewTemplate}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Create Template</span>
                      </button>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Default Templates</h2>
                        <p className="text-sm text-gray-600">Ready-to-use templates you can duplicate and customize</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {defaultTemplates.map((template: any) => (
                      <div key={template.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <template.icon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                {template.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{template.description}</p>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                          <p className="text-xs font-bold text-blue-900 mb-2 uppercase">Example:</p>
                          <p className="text-sm text-gray-900">{template.example}</p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-xs text-yellow-900">
                            <span className="font-bold">When to use:</span> {template.whenToUse}
                          </p>
                        </div>

                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Duplicate & Customize</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {showTemplateEditor && editingTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {showManualForm ? 'Edit Template' : 'Create New Template'}
                      </h2>
                      <button
                        onClick={() => {
                          setShowTemplateEditor(false);
                          setEditingTemplate(null);
                          setTemplateDescription('');
                          setShowManualForm(false);
                        }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6">
                      {!showManualForm ? (
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                              Describe the template you want to create
                            </label>
                            <textarea
                              value={templateDescription}
                              onChange={(e) => setTemplateDescription(e.target.value)}
                              placeholder="Example: I want a template to send weekly portfolio performance updates to my clients including gains, losses, and top performing stocks..."
                              rows={6}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                            />
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start space-x-3">
                              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-blue-900 mb-1">AI will help you</p>
                                <p className="text-sm text-blue-800">
                                  Describe what you want and we'll generate a template structure with variables, example content, and usage guidelines.
                                </p>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={generateTemplateFromDescription}
                            disabled={!templateDescription.trim()}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                          >
                            <Sparkles className="w-5 h-5" />
                            <span>Generate Template</span>
                          </button>

                          <div className="border-t border-gray-200 pt-6">
                            <button
                              onClick={() => setShowManualForm(true)}
                              className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                              Or create manually
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              Template Name
                            </label>
                            <input
                              type="text"
                              value={(editingTemplate as any).name}
                              onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="e.g., My Custom Alert"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              Description
                            </label>
                            <input
                              type="text"
                              value={(editingTemplate as any).description}
                              onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="What is this template for?"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              Message Content
                            </label>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                              <p className="text-xs text-blue-900">
                                <span className="font-bold">Tip:</span> Use double curly braces around variable names for personalization.
                              </p>
                            </div>
                            <textarea
                              value={(editingTemplate as any).content}
                              onChange={(e) => {
                                const newContent = e.target.value;
                                const variables = extractVariables(newContent);
                                setEditingTemplate({
                                  ...editingTemplate, 
                                  content: newContent,
                                  variables: variables.length > 0 ? variables : ['name']
                                });
                              }}
                              rows={4}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="Your message template..."
                            />
                            {(editingTemplate as any).variables && (editingTemplate as any).variables.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="text-xs font-semibold text-gray-700">Variables detected:</span>
                                {(editingTemplate as any).variables.map((v: string) => (
                                  <span key={v} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              Example Message
                            </label>
                            <textarea
                              value={(editingTemplate as any).example}
                              onChange={(e) => setEditingTemplate({...editingTemplate, example: e.target.value})}
                              rows={3}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="Show how this template looks with real data..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              When to Use
                            </label>
                            <input
                              type="text"
                              value={(editingTemplate as any).whenToUse}
                              onChange={(e) => setEditingTemplate({...editingTemplate, whenToUse: e.target.value})}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="Describe when to use this template..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              Category
                            </label>
                            <select
                              value={(editingTemplate as any).category}
                              onChange={(e) => setEditingTemplate({...editingTemplate, category: e.target.value})}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            >
                              <option value="Trading">Trading</option>
                              <option value="General">General</option>
                              <option value="Reports">Reports</option>
                              <option value="Custom">Custom</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-3 mt-8">
                            <button
                              onClick={() => {
                                setShowTemplateEditor(false);
                                setEditingTemplate(null);
                                setTemplateDescription('');
                                setShowManualForm(false);
                              }}
                              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveTemplate(editingTemplate)}
                              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                            >
                              Save Template
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentScreen === 'groups') {
    return (
      <>
        <Toast />
        <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 space-y-3">
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contact Groups</h1>
                    <p className="text-gray-600">Organized lists of your contacts</p>
                  </div>
                  <button
                    onClick={() => setCurrentScreen('home')}
                    className="px-4 sm:px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map(group => (
                      <div key={group.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mb-4">
                          <Users className="w-7 h-7 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{group.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{group.description}</p>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                          <p className="text-3xl font-bold text-gray-900 mb-1">{group.count}</p>
                          <p className="text-xs text-gray-600 uppercase font-bold tracking-wide">Total Contacts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentScreen === 'picks') {
    return (
      <>
        <Toast />
        <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 space-y-3">
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Trading Picks</h1>
                    <p className="text-gray-600">Create and manage your trading recommendations</p>
                  </div>
                  <button
                    onClick={() => setCurrentScreen('home')}
                    className="px-4 sm:px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Pick</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Pick Name
                          </label>
                          <input
                            type="text"
                            value={newPick.name}
                            onChange={(e) => setNewPick({...newPick, name: e.target.value})}
                            placeholder="e.g., Pick for 24 June"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              From Date
                            </label>
                            <input
                              type="text"
                              value={newPick.validFrom}
                              onChange={(e) => setNewPick({...newPick, validFrom: e.target.value})}
                              placeholder="June 3rd"
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              To Date
                            </label>
                            <input
                              type="text"
                              value={newPick.validTo}
                              onChange={(e) => setNewPick({...newPick, validTo: e.target.value})}
                              placeholder="21st"
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Ticker
                          </label>
                          <input
                            type="text"
                            value={newPick.ticker}
                            onChange={(e) => setNewPick({...newPick, ticker: e.target.value})}
                            placeholder="e.g., AAPL, TSLA"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Category
                          </label>
                          <select
                            value={newPick.category}
                            onChange={(e) => setNewPick({...newPick, category: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Select category</option>
                            <option value="Tech">Tech</option>
                            <option value="Finance">Finance</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Energy">Energy</option>
                            <option value="Index">Index</option>
                            <option value="Commodities">Commodities</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Confidence
                          </label>
                          <input
                            type="text"
                            value={newPick.confidence}
                            onChange={(e) => setNewPick({...newPick, confidence: e.target.value})}
                            placeholder="e.g., 70%"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Summary
                        </label>
                        <textarea
                          value={newPick.summary}
                          onChange={(e) => setNewPick({...newPick, summary: e.target.value})}
                          placeholder="Enter pick summary here. Will be processed by AI and generated"
                          rows={12}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={savePick}
                      className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Save this pick
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Active Picks</h2>
                    
                    {picks.length === 0 ? (
                      <div className="text-center py-12">
                        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No active picks yet. Create your first pick above!</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-gray-200">
                              <th className="text-left py-3 px-4">
                                <input
                                  type="checkbox"
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPicks(picks.map(p => p.id));
                                    } else {
                                      setSelectedPicks([]);
                                    }
                                  }}
                                  className="w-5 h-5 text-blue-600 rounded"
                                />
                              </th>
                              <th className="text-left py-3 px-4 font-bold text-gray-900">Active Picks</th>
                              <th className="text-left py-3 px-4 font-bold text-gray-900">Ticker</th>
                              <th className="text-left py-3 px-4 font-bold text-gray-900">Valid Dates</th>
                              <th className="text-left py-3 px-4 font-bold text-gray-900">Confidence</th>
                              <th className="text-right py-3 px-4 font-bold text-gray-900">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {picks.map((pick) => (
                              <tr key={pick.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-4">
                                  <input
                                    type="checkbox"
                                    checked={selectedPicks.includes(pick.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedPicks([...selectedPicks, pick.id]);
                                      } else {
                                        setSelectedPicks(selectedPicks.filter(id => id !== pick.id));
                                      }
                                    }}
                                    className="w-5 h-5 text-blue-600 rounded"
                                  />
                                </td>
                                <td className="py-4 px-4">
                                  <div>
                                    <p className="font-bold text-gray-900">{pick.name}</p>
                                    <p className="text-sm text-gray-600">{pick.category}</p>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                    {pick.ticker}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <p className="text-gray-900">{pick.validFrom} - {pick.validTo}</p>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="text-gray-900 font-semibold">{pick.confidence}</span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <button
                                    onClick={() => sendPickMessage(pick)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm inline-flex items-center space-x-2"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Send WhatsApp</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedPicks.length > 0 && (
                      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-blue-900 font-semibold">
                            {selectedPicks.length} pick(s) selected
                          </p>
                          <button
                            onClick={() => {
                              const selectedPicksData = picks.filter(p => selectedPicks.includes(p.id));
                              if (selectedPicksData.length > 0) {
                                sendPickMessage(selectedPicksData[0]);
                              }
                            }}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Send Selected to WhatsApp
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}

export default function ContentStudioPage() {
  return (
    <>
      <PartnerHeader
        title="Content Studio"
        subtitle="Design, manage and send your content."
      />
      <main className="flex-1 overflow-y-auto">
        <MessagingPlatform />
      </main>
    </>
  );
}
