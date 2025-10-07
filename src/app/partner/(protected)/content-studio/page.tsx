
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import {
  MessageCircle, Users, FileText, Send, X, Sparkles, ChevronRight,
  Smartphone, Check, Plus, ArrowRight, AlertCircle, Eye, Info, TrendingUp,
  Zap, Clock, HelpCircle, Copy, Edit, Trash2, Loader2
} from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { ContactGroup } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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

  // New state for Firestore data
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Fetch Contact Groups from Firestore
  useEffect(() => {
    if (!currentWorkspace?.partnerId) {
      setIsLoadingGroups(false);
      return;
    }
    
    setIsLoadingGroups(true);
    const collectionPath = `partners/${currentWorkspace.partnerId}/contactGroups`;
    const q = query(
      collection(db, collectionPath)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ContactGroup));
      setContactGroups(groupsData);
      setIsLoadingGroups(false);
    }, (serverError) => {
      // Create and emit a contextual permission error
      const permissionError = new FirestorePermissionError({
        path: collectionPath,
        operation: 'list',
        serverError,
      });
      errorEmitter.emit('permission-error', permissionError);

      // Also update local UI state to show a friendly error
      setFirestoreError("You don't have permission to view contact groups. Please contact your administrator.");
      setIsLoadingGroups(false);
    });

    return () => unsubscribe();
  }, [currentWorkspace?.partnerId]);


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
    return contactGroups.filter(g => selectedGroups.includes(g.id!)).reduce((sum, g) => sum + (g.contactCount || 0), 0);
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
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${sendStep >= step.num
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
                }`}>
                {sendStep > step.num ? <Check className="w-5 h-5" /> : step.num}
              </div>
              <span className={`ml-2 text-sm font-medium ${sendStep >= step.num ? 'text-gray-900' : 'text-gray-500'
                }`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-12 h-1 mx-4 rounded ${sendStep > step.num ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (currentScreen === 'home') {
    const totalContacts = contactGroups.reduce((sum, g) => sum + (g.contactCount || 0), 0);
    return (
      <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
        <Toast />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 space-y-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card
                onClick={() => setCurrentScreen('templates')}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-purple-300 group cursor-pointer"
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
              </Card>

              <Card
                onClick={() => setCurrentScreen('groups')}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-green-300 group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <Users className="w-10 h-10 text-green-600" />
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    {isLoadingGroups ? <Loader2 className="w-3 h-3 animate-spin"/> : `${totalContacts} CONTACTS`}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                  Contact Groups
                </h3>
                <p className="text-gray-600 text-sm">View and manage your contact lists</p>
              </Card>
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
                      <Textarea
                        value={messageType}
                        onChange={(e) => setMessageType(e.target.value)}
                        placeholder="Example: I want to share my latest trading pick for Tesla with a buy recommendation valid until end of month..."
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base resize-none"
                      />
                      <button
                        onClick={() => {
                          if (messageType.trim()) {
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
                            <Input
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
                      {contactGroups.map(group => (
                        <label
                          key={group.id}
                          className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${selectedGroups.includes(group.id!)
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group.id!)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroups([...selectedGroups, group.id!]);
                              } else {
                                setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                              }
                            }}
                            className="w-6 h-6 text-blue-600 rounded border-2 border-gray-300"
                          />
                          <div className="ml-4 flex-1">
                            <p className="text-lg font-bold text-gray-900">{group.name}</p>
                            <p className="text-sm text-gray-600">{group.description}</p>
                          </div>
                          <div className="text-right bg-white rounded-lg px-4 py-2">
                            <p className="text-2xl font-bold text-gray-900">{group.contactCount}</p>
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
                            {contactGroups.filter(g => selectedGroups.includes(g.id!)).map(g => g.name).join(', ')}
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
                            className={`p-6 border-2 rounded-xl transition-all ${selectedChannel === 'whatsapp'
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
                            className={`p-6 border-2 rounded-xl transition-all ${selectedChannel === 'sms'
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
            <div className="max-w-6xl mx-auto p-4 space-y-6">
              <Card className="shadow-md">
                <CardHeader>
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
                </CardHeader>
              </Card>

              <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-6">
                  {userTemplates.length > 0 && (
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
                          <Card key={template.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 hover:shadow-lg transition-all">
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
                              <Button
                                onClick={() => editTemplate(template)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteTemplate(template.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <h2 className="text-xl font-bold text-gray-900">Default Templates</h2>
                      <p className="text-sm text-gray-600">Ready-to-use templates you can duplicate and customize</p>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {defaultTemplates.map((template: any) => (
                        <Card key={template.id} className="p-6 hover:shadow-lg transition-all">
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
                          <Button
                            onClick={() => duplicateTemplate(template)}
                            className="w-full"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate & Customize
                          </Button>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
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
                            <Textarea
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

                          <Button
                            onClick={generateTemplateFromDescription}
                            disabled={!templateDescription.trim()}
                            className="w-full"
                          >
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate Template
                          </Button>

                          <div className="border-t border-gray-200 pt-6">
                            <Button
                              onClick={() => setShowManualForm(true)}
                              className="w-full"
                              variant="outline"
                            >
                              Or create manually
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div>
                            <Label>Template Name</Label>
                            <Input
                              type="text"
                              value={(editingTemplate as any).name}
                              onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                            />
                          </div>
                          <Button onClick={() => saveTemplate(editingTemplate)}>
                            Save Template
                          </Button>
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
            <div className="max-w-6xl mx-auto p-4 space-y-6">
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Contact Groups</h1>
                      <p className="text-gray-600 mt-1">Organize and segment your subscriber base</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <Button variant="outline" onClick={() => setCurrentScreen('home')}>
                         ← Back
                       </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {isLoadingGroups && (
                <div className="text-center py-10">
                   <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
                   <p className="mt-4 text-sm text-gray-600">Loading contact groups...</p>
                </div>
              )}
              {firestoreError && (
                 <div className="text-center py-10 text-red-600">
                   <AlertCircle className="mx-auto h-12 w-12" />
                   <p className="mt-4 text-sm">{firestoreError}</p>
                 </div>
              )}
              {!isLoadingGroups && !firestoreError && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contactGroups.map(group => (
                    <Card key={group.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-1">{group.description}</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-3xl font-bold text-gray-900 mb-1">{group.contactCount}</p>
                          <p className="text-xs text-gray-600 uppercase font-bold tracking-wide">Total Contacts</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
