"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Building2, MapPin, Phone, Mail, Globe, Clock, Star, Users,
  Sparkles, Tag, Package, MessageSquare, FileText, ChevronRight,
  Edit2, Check, X, Plus, Trash2, ExternalLink, IndianRupee,
  AlertCircle, Lightbulb, Camera, Quote, Brain, Zap, ChevronDown,
  Store, Utensils, Bed, Home, Stethoscope, GraduationCap, Car,
  Scale, Landmark, Calendar, Heart, Save, RefreshCw, Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import type { BusinessPersona, ProductService, FrequentlyAskedQuestion } from '@/lib/business-persona-types';

interface BusinessProfileViewProps {
  persona: Partial<BusinessPersona>;
  partnerId: string;
  onFieldUpdate: (path: string, value: any) => Promise<void>;
  onRefresh?: () => Promise<void>;
  onOpenWizard?: () => void;
  isAdmin?: boolean;
}

// Field editing component
function EditableField({
  label,
  value,
  type = 'text',
  placeholder,
  onSave,
  multiline = false,
  className,
}: {
  label: string;
  value: string | undefined | null | { [key: string]: any };
  type?: 'text' | 'email' | 'phone' | 'url';
  placeholder?: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const getStringValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return val.name || val.value || val.text || val.title || '';
    }
    return String(val);
  };

  const stringValue = getStringValue(value);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(stringValue);

  React.useEffect(() => {
    setEditValue(getStringValue(value));
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(stringValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-start gap-2", className)}>
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            autoFocus
          />
        ) : (
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        )}
        <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("group flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 -mx-2 rounded-lg transition-colors", className)}
      onClick={() => setIsEditing(true)}
    >
      <span className={cn("text-sm", stringValue ? "text-slate-700" : "text-slate-400 italic")}>
        {stringValue || placeholder || `Add ${label.toLowerCase()}`}
      </span>
      <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// Tags editing component
function EditableTags({
  tags,
  onSave,
  placeholder = "Add item",
  maxTags = 10,
}: {
  tags: string[];
  onSave: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}) {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newTag.trim() && tags.length < maxTags) {
      onSave([...tags, newTag.trim()]);
      setNewTag('');
      setIsAdding(false);
    }
  };

  const handleRemove = (index: number) => {
    onSave(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm group"
        >
          {tag}
          <button
            onClick={() => handleRemove(index)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {isAdding ? (
        <div className="inline-flex items-center gap-1">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={placeholder}
            className="w-32 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <button onClick={handleAdd} className="p-1 text-green-600 hover:bg-green-50 rounded">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setIsAdding(false); setNewTag(''); }} className="p-1 text-slate-400 hover:bg-slate-50 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : tags.length < maxTags ? (
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1 px-3 py-1 border border-dashed border-slate-300 text-slate-500 rounded-full text-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      ) : null}
    </div>
  );
}

// Section card component
function SectionCard({
  icon: Icon,
  title,
  badge,
  children,
  className,
  collapsible = false,
  defaultExpanded = true,
  action,
}: {
  icon: React.ElementType;
  title: string;
  badge?: { text: string; color: string };
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  action?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}>
      <div
        className={cn(
          "flex items-center justify-between px-5 py-4 border-b border-slate-100",
          collapsible && "cursor-pointer hover:bg-slate-50"
        )}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {badge && (
            <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", badge.color)}>
              {badge.text}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {collapsible && (
            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", expanded && "rotate-180")} />
          )}
        </div>
      </div>
      {(!collapsible || expanded) && (
        <div className="p-5">{children}</div>
      )}
    </div>
  );
}

// Editable Inventory Item with inline editing
function EditableInventoryCard({
  item,
  index,
  type,
  icon: Icon,
  onUpdate,
  onRemove,
}: {
  item: any;
  index: number;
  type: string;
  icon: React.ElementType;
  onUpdate: (updatedItem: any) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);

  const getName = () => {
    const val = item.name || item.title;
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val !== null) return val.name || val.title || val.text || `Item ${index + 1}`;
    return `Item ${index + 1}`;
  };

  const getPrice = () => {
    const price = item.price || item.fee || item.rate;
    if (typeof price === 'number') return price;
    if (typeof price === 'object' && price !== null) return price.value || 0;
    if (typeof price === 'string') {
      const parsed = parseFloat(price.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const getDescription = () => {
    const val = item.description;
    if (typeof val === 'string') return val;
    return '';
  };

  const getCategory = () => {
    const val = item.category || item.type;
    if (typeof val === 'string') return val;
    return '';
  };

  const handleSave = () => {
    onUpdate(editedItem);
    setIsEditing(false);
    toast.success('Item updated');
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-white border-2 border-indigo-200 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-600 uppercase">{type}</span>
          <div className="flex gap-1">
            <button onClick={handleSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditedItem(item); setIsEditing(false); }} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <input
          type="text"
          value={editedItem.name || ''}
          onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
          placeholder="Item name"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={typeof editedItem.price === 'number' ? editedItem.price : ''}
            onChange={(e) => setEditedItem({ ...editedItem, price: parseFloat(e.target.value) || 0 })}
            placeholder="Price (INR)"
            className="px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={editedItem.category || editedItem.type || ''}
            onChange={(e) => setEditedItem({ ...editedItem, category: e.target.value })}
            placeholder="Category"
            className="px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <textarea
          value={editedItem.description || ''}
          onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
          placeholder="Description"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={2}
        />
      </div>
    );
  }

  const price = getPrice();

  return (
    <div className="group relative p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <Icon className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-slate-800 truncate">{getName()}</h4>
              {getCategory() && (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] uppercase tracking-wide">
                  {getCategory()}
                </span>
              )}
            </div>
            {getDescription() && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{getDescription()}</p>
            )}
          </div>
        </div>
        {price > 0 && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-xs font-bold shadow-sm">
              <IndianRupee className="w-3 h-3" />
              {price.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Edit/Remove buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button onClick={() => setIsEditing(true)} className="p-1.5 bg-white rounded shadow-sm hover:bg-indigo-50 text-indigo-600">
          <Edit2 className="w-3 h-3" />
        </button>
        <button onClick={onRemove} className="p-1.5 bg-white rounded shadow-sm hover:bg-red-50 text-red-600">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Add New Item Dialog
function AddItemDialog({
  type,
  icon: Icon,
  onAdd,
  onClose,
}: {
  type: string;
  icon: React.ElementType;
  onAdd: (item: any) => void;
  onClose: () => void;
}) {
  const [item, setItem] = useState({ name: '', price: 0, category: '', description: '' });

  const handleAdd = () => {
    if (item.name.trim()) {
      onAdd(item);
      toast.success('Item added');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Icon className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-lg text-slate-800">Add {type}</h3>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={item.name}
            onChange={(e) => setItem({ ...item, name: e.target.value })}
            placeholder="Name *"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={item.price || ''}
              onChange={(e) => setItem({ ...item, price: parseFloat(e.target.value) || 0 })}
              placeholder="Price (INR)"
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={item.category}
              onChange={(e) => setItem({ ...item, category: e.target.value })}
              placeholder="Category"
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <textarea
            value={item.description}
            onChange={(e) => setItem({ ...item, description: e.target.value })}
            placeholder="Description"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!item.name.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

// Editable FAQ
function EditableFAQ({
  faq,
  index,
  onUpdate,
  onRemove,
}: {
  faq: any;
  index: number;
  onUpdate: (faq: any) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFaq, setEditedFaq] = useState(faq);

  const question = typeof faq.question === 'string' ? faq.question : `Question ${index + 1}`;
  const answer = typeof faq.answer === 'string' ? faq.answer : '';

  const handleSave = () => {
    onUpdate(editedFaq);
    setIsEditing(false);
    toast.success('FAQ updated');
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-white border-2 border-indigo-200 rounded-lg space-y-3">
        <input
          type="text"
          value={editedFaq.question || ''}
          onChange={(e) => setEditedFaq({ ...editedFaq, question: e.target.value })}
          placeholder="Question"
          className="w-full px-3 py-2 text-sm font-medium border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <textarea
          value={editedFaq.answer || ''}
          onChange={(e) => setEditedFaq({ ...editedFaq, answer: e.target.value })}
          placeholder="Answer"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => { setEditedFaq(faq); setIsEditing(false); }} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded">
            Cancel
          </button>
          <button onClick={handleSave} className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative p-4 bg-slate-50 rounded-lg hover:border-indigo-200 border border-transparent transition-colors">
      <h4 className="font-medium text-slate-800 mb-2 pr-16">{question}</h4>
      <p className="text-sm text-slate-600">{answer}</p>
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button onClick={() => setIsEditing(true)} className="p-1.5 bg-white rounded shadow-sm hover:bg-indigo-50 text-indigo-600">
          <Edit2 className="w-3 h-3" />
        </button>
        <button onClick={onRemove} className="p-1.5 bg-white rounded shadow-sm hover:bg-red-50 text-red-600">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Operating Hours Editor
function OperatingHoursEditor({
  hours,
  onSave,
}: {
  hours: any;
  onSave: (hours: any) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedHours, setEditedHours] = useState(hours || {});

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const handleToggle24x7 = () => {
    onSave({ ...editedHours, isOpen24x7: !editedHours.isOpen24x7 });
  };

  const handleToggleAppointmentOnly = () => {
    onSave({ ...editedHours, appointmentOnly: !editedHours.appointmentOnly });
  };

  const handleDayChange = (day: string, field: 'open' | 'close', value: string) => {
    const newSchedule = { ...(editedHours.schedule || {}) };
    newSchedule[day] = { ...(newSchedule[day] || {}), [field]: value };
    setEditedHours({ ...editedHours, schedule: newSchedule });
  };

  const handleSaveSchedule = () => {
    onSave(editedHours);
    setIsEditing(false);
    toast.success('Hours updated');
  };

  if (hours?.isOpen24x7) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Open 24/7</span>
          <button onClick={handleToggle24x7} className="ml-auto text-xs text-green-600 hover:text-green-800">
            Change
          </button>
        </div>
      </div>
    );
  }

  if (hours?.appointmentOnly) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">By Appointment Only</span>
          <button onClick={handleToggleAppointmentOnly} className="ml-auto text-xs text-blue-600 hover:text-blue-800">
            Change
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {days.map((day) => (
            <div key={day} className="flex items-center gap-2">
              <span className="w-24 text-sm font-medium text-slate-600 capitalize">{day}</span>
              <input
                type="time"
                value={editedHours.schedule?.[day]?.open || '09:00'}
                onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                className="px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-slate-400">to</span>
              <input
                type="time"
                value={editedHours.schedule?.[day]?.close || '18:00'}
                onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                className="px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <div className="flex gap-2">
            <button onClick={handleToggle24x7} className="text-xs text-indigo-600 hover:text-indigo-800">
              Set 24/7
            </button>
            <button onClick={handleToggleAppointmentOnly} className="text-xs text-indigo-600 hover:text-indigo-800">
              Appointment Only
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-sm">
              Cancel
            </button>
            <button onClick={handleSaveSchedule} className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hours?.schedule) {
    return (
      <div className="space-y-2">
        {Object.entries(hours.schedule).map(([day, dayHours]: [string, any]) => (
          <div key={day} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm font-medium text-slate-600 capitalize">{day}</span>
            <span className="text-sm text-slate-700">
              {dayHours?.open && dayHours?.close ? `${dayHours.open} - ${dayHours.close}` : 'Closed'}
            </span>
          </div>
        ))}
        <button onClick={() => setIsEditing(true)} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <Edit2 className="w-3 h-3" /> Edit Hours
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <p className="text-sm text-slate-500 italic mb-3">No hours set</p>
      <button onClick={() => setIsEditing(true)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mx-auto">
        <Plus className="w-3 h-3" /> Add Operating Hours
      </button>
    </div>
  );
}

// AI Suggestions Component
function AISuggestions({
  persona,
  onFieldFocus,
}: {
  persona: Partial<BusinessPersona>;
  onFieldFocus: (field: string) => void;
}) {
  const suggestions = useMemo(() => {
    const items: { field: string; label: string; priority: 'high' | 'medium' | 'low'; reason: string }[] = [];

    if (!persona.identity?.name) {
      items.push({ field: 'identity.name', label: 'Business Name', priority: 'high', reason: 'Required for all communications' });
    }
    if (!persona.personality?.description || persona.personality.description.length < 50) {
      items.push({ field: 'personality.description', label: 'Business Description', priority: 'high', reason: 'Helps AI understand your business' });
    }
    if (!persona.identity?.phone) {
      items.push({ field: 'identity.phone', label: 'Phone Number', priority: 'high', reason: 'Primary contact method' });
    }
    if (!persona.identity?.email) {
      items.push({ field: 'identity.email', label: 'Email Address', priority: 'medium', reason: 'For customer inquiries' });
    }
    if (!persona.identity?.address?.city) {
      items.push({ field: 'identity.address.city', label: 'City/Location', priority: 'medium', reason: 'Helps local customers find you' });
    }
    if (!persona.personality?.uniqueSellingPoints?.length) {
      items.push({ field: 'personality.uniqueSellingPoints', label: 'What Makes You Special', priority: 'medium', reason: 'Differentiates your business' });
    }
    if (!persona.customerProfile?.targetAudience) {
      items.push({ field: 'customerProfile.targetAudience', label: 'Target Audience', priority: 'medium', reason: 'Helps tailor AI responses' });
    }
    if (!persona.knowledge?.productsOrServices?.length) {
      items.push({ field: 'knowledge.productsOrServices', label: 'Products/Services', priority: 'high', reason: 'Essential for customer queries' });
    }
    if (!persona.knowledge?.faqs?.length) {
      items.push({ field: 'knowledge.faqs', label: 'FAQs', priority: 'low', reason: 'Reduces repetitive queries' });
    }
    if (!persona.identity?.operatingHours?.isOpen24x7 && !persona.identity?.operatingHours?.schedule) {
      items.push({ field: 'identity.operatingHours', label: 'Operating Hours', priority: 'medium', reason: 'Customers need to know when you\'re available' });
    }

    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [persona]);

  if (suggestions.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="p-2 bg-green-100 rounded-lg">
          <Check className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h4 className="font-medium text-green-800">Profile Complete!</h4>
          <p className="text-sm text-green-600">All essential fields are filled. Your AI agent is ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Lightbulb className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="font-semibold text-amber-800">Complete Your Profile</h4>
          <p className="text-sm text-amber-600">{suggestions.length} fields need attention</p>
        </div>
      </div>
      <div className="space-y-2">
        {suggestions.slice(0, 5).map((suggestion) => (
          <button
            key={suggestion.field}
            onClick={() => onFieldFocus(suggestion.field)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className={cn(
                "w-2 h-2 rounded-full",
                suggestion.priority === 'high' && "bg-red-500",
                suggestion.priority === 'medium' && "bg-amber-500",
                suggestion.priority === 'low' && "bg-slate-400"
              )} />
              <div>
                <span className="font-medium text-sm text-slate-800">{suggestion.label}</span>
                <p className="text-xs text-slate-500">{suggestion.reason}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Profile Completeness Score
function CompletenessScore({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-200" />
          <circle
            cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none"
            strokeDasharray={`${(score / 100) * 176} 176`}
            className={score >= 80 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'}
          />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold", getColor().split(' ')[0])}>
          {score}%
        </span>
      </div>
      <div>
        <p className="font-medium text-slate-800">Profile Score</p>
        <p className="text-xs text-slate-500">
          {score >= 80 ? 'Excellent!' : score >= 50 ? 'Good progress' : 'Needs attention'}
        </p>
      </div>
    </div>
  );
}

// Main Component
export default function BusinessProfileView({
  persona,
  partnerId,
  onFieldUpdate,
  onRefresh,
  onOpenWizard,
  isAdmin = true,
}: BusinessProfileViewProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addingItemType, setAddingItemType] = useState<{ type: string; path: string; icon: React.ElementType } | null>(null);
  const [addingFAQ, setAddingFAQ] = useState(false);

  // Helper to get inventory icon based on industry
  const getInventoryIcon = () => {
    const industry = persona.identity?.industry?.category;
    switch (industry) {
      case 'hospitality': return Bed;
      case 'food_beverage': return Utensils;
      case 'retail': return Store;
      case 'healthcare': return Stethoscope;
      case 'real_estate': return Home;
      case 'education': return GraduationCap;
      case 'automotive': return Car;
      case 'legal': return Scale;
      case 'finance': return Landmark;
      default: return Package;
    }
  };

  // Get inventory path based on type
  const getInventoryPath = (type: string) => {
    const pathMap: Record<string, string> = {
      'Room Types': 'roomTypes',
      'Menu Items': 'menuItems',
      'Products': 'productCatalog',
      'Healthcare Services': 'healthcareServices',
      'Property Listings': 'propertyListings',
      'Diagnostic Tests': 'diagnosticTests',
      'Courses': 'industrySpecificData.courses',
      'Treatments': 'industrySpecificData.treatments',
      'Memberships': 'industrySpecificData.memberships',
      'Vehicles': 'industrySpecificData.vehicles',
      'Venue Packages': 'industrySpecificData.venuePackages',
      'Legal Services': 'industrySpecificData.legalServices',
      'Financial Products': 'industrySpecificData.financialProducts',
      'Products & Services': 'knowledge.productsOrServices',
    };
    return pathMap[type] || 'knowledge.productsOrServices';
  };

  // Helper to get inventory items based on industry
  const getInventoryItems = () => {
    const items: { type: string; data: any[]; icon: React.ElementType; path: string }[] = [];
    const isd = persona.industrySpecificData || {};

    if (persona.roomTypes?.length) {
      items.push({ type: 'Room Types', data: persona.roomTypes, icon: Bed, path: 'roomTypes' });
    }
    if (persona.menuItems?.length) {
      items.push({ type: 'Menu Items', data: persona.menuItems, icon: Utensils, path: 'menuItems' });
    }
    if (persona.productCatalog?.length) {
      items.push({ type: 'Products', data: persona.productCatalog, icon: Store, path: 'productCatalog' });
    }
    if (persona.healthcareServices?.length) {
      items.push({ type: 'Healthcare Services', data: persona.healthcareServices, icon: Stethoscope, path: 'healthcareServices' });
    }
    if (persona.propertyListings?.length) {
      items.push({ type: 'Property Listings', data: persona.propertyListings, icon: Home, path: 'propertyListings' });
    }
    if (persona.diagnosticTests?.length) {
      items.push({ type: 'Diagnostic Tests', data: persona.diagnosticTests, icon: Stethoscope, path: 'diagnosticTests' });
    }
    if (isd.courses?.length) {
      items.push({ type: 'Courses', data: isd.courses, icon: GraduationCap, path: 'industrySpecificData.courses' });
    }
    if (isd.treatments?.length) {
      items.push({ type: 'Treatments', data: isd.treatments, icon: Heart, path: 'industrySpecificData.treatments' });
    }
    if (isd.memberships?.length) {
      items.push({ type: 'Memberships', data: isd.memberships, icon: Users, path: 'industrySpecificData.memberships' });
    }
    if (isd.vehicles?.length) {
      items.push({ type: 'Vehicles', data: isd.vehicles, icon: Car, path: 'industrySpecificData.vehicles' });
    }
    if (isd.venuePackages?.length) {
      items.push({ type: 'Venue Packages', data: isd.venuePackages, icon: Calendar, path: 'industrySpecificData.venuePackages' });
    }
    if (isd.legalServices?.length) {
      items.push({ type: 'Legal Services', data: isd.legalServices, icon: Scale, path: 'industrySpecificData.legalServices' });
    }
    if (isd.financialProducts?.length) {
      items.push({ type: 'Financial Products', data: isd.financialProducts, icon: Landmark, path: 'industrySpecificData.financialProducts' });
    }
    if (items.length === 0 && persona.knowledge?.productsOrServices?.length) {
      items.push({ type: 'Products & Services', data: persona.knowledge.productsOrServices, icon: Package, path: 'knowledge.productsOrServices' });
    }

    return items;
  };

  const inventoryItems = getInventoryItems();
  const profileScore = persona.setupProgress?.overallPercentage || 0;

  const handleSave = async (path: string, value: any) => {
    setIsSaving(true);
    try {
      await onFieldUpdate(path, value);
      toast.success('Saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInventoryUpdate = async (path: string, items: any[], index: number, updatedItem: any) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    await handleSave(path, newItems);
  };

  const handleInventoryRemove = async (path: string, items: any[], index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    await handleSave(path, newItems);
    toast.success('Item removed');
  };

  const handleInventoryAdd = async (path: string, items: any[], newItem: any) => {
    const newItems = [...items, newItem];
    await handleSave(path, newItems);
    setAddingItemType(null);
  };

  const handleFAQUpdate = async (index: number, updatedFaq: any) => {
    const faqs = [...(persona.knowledge?.faqs || [])];
    faqs[index] = updatedFaq;
    await handleSave('knowledge.faqs', faqs);
  };

  const handleFAQRemove = async (index: number) => {
    const faqs = (persona.knowledge?.faqs || []).filter((_, i) => i !== index);
    await handleSave('knowledge.faqs', faqs);
    toast.success('FAQ removed');
  };

  const handleFAQAdd = async (faq: any) => {
    const faqs = [...(persona.knowledge?.faqs || []), faq];
    await handleSave('knowledge.faqs', faqs);
    setAddingFAQ(false);
    toast.success('FAQ added');
  };

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {persona.identity?.name || 'Your Business'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {persona.identity?.industry?.name || 'Set up your business profile'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CompletenessScore score={profileScore} />
          {onOpenWizard && (
            <button
              onClick={onOpenWizard}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
              title="Edit with Wizard"
            >
              <Wand2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      <AISuggestions persona={persona} onFieldFocus={setFocusedField} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Identity */}
        <SectionCard icon={Building2} title="Business Identity">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business Name</label>
              <EditableField
                label="Business Name"
                value={persona.identity?.name}
                onSave={(v) => handleSave('identity.name', v)}
                placeholder="Enter your business name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tagline</label>
              <EditableField
                label="Tagline"
                value={persona.personality?.tagline}
                onSave={(v) => handleSave('personality.tagline', v)}
                placeholder="A short catchy phrase"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
              <EditableField
                label="Description"
                value={persona.personality?.description}
                onSave={(v) => handleSave('personality.description', v)}
                placeholder="Tell customers about your business"
                multiline
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">What Makes You Special</label>
              <EditableTags
                tags={persona.personality?.uniqueSellingPoints || []}
                onSave={(tags) => handleSave('personality.uniqueSellingPoints', tags)}
                placeholder="Add USP"
              />
            </div>
          </div>
        </SectionCard>

        {/* Contact & Location */}
        <SectionCard icon={MapPin} title="Contact & Location">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </label>
                <EditableField
                  label="Phone"
                  type="phone"
                  value={persona.identity?.phone}
                  onSave={(v) => handleSave('identity.phone', v)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <EditableField
                  label="Email"
                  type="email"
                  value={persona.identity?.email}
                  onSave={(v) => handleSave('identity.email', v)}
                  placeholder="hello@business.com"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Globe className="w-3 h-3" /> Website
              </label>
              <EditableField
                label="Website"
                type="url"
                value={persona.identity?.website}
                onSave={(v) => handleSave('identity.website', v)}
                placeholder="https://yourbusiness.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Street Address</label>
                <EditableField
                  label="Street"
                  value={persona.identity?.address?.street}
                  onSave={(v) => handleSave('identity.address.street', v)}
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">City</label>
                <EditableField
                  label="City"
                  value={persona.identity?.address?.city}
                  onSave={(v) => handleSave('identity.address.city', v)}
                  placeholder="City"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">State</label>
                <EditableField
                  label="State"
                  value={persona.identity?.address?.state}
                  onSave={(v) => handleSave('identity.address.state', v)}
                  placeholder="State"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Postal Code</label>
                <EditableField
                  label="Postal Code"
                  value={persona.identity?.address?.postalCode}
                  onSave={(v) => handleSave('identity.address.postalCode', v)}
                  placeholder="123456"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Operating Hours */}
        <SectionCard icon={Clock} title="Operating Hours">
          <OperatingHoursEditor
            hours={persona.identity?.operatingHours}
            onSave={(hours) => handleSave('identity.operatingHours', hours)}
          />
        </SectionCard>

        {/* Target Audience */}
        <SectionCard icon={Users} title="Target Audience">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Who are your customers?</label>
              <EditableField
                label="Target Audience"
                value={persona.customerProfile?.targetAudience}
                onSave={(v) => handleSave('customerProfile.targetAudience', v)}
                placeholder="Describe your ideal customers"
                multiline
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Common Questions</label>
              <EditableTags
                tags={(persona.customerProfile?.commonQueries || []).map((q: any) => typeof q === 'string' ? q : String(q))}
                onSave={(tags) => handleSave('customerProfile.commonQueries', tags)}
                placeholder="Add question"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Inventory Section - Full Width */}
      <SectionCard
        icon={getInventoryIcon()}
        title="Inventory & Pricing"
        badge={inventoryItems.length > 0 ? { text: `${inventoryItems.reduce((acc, i) => acc + i.data.length, 0)} items`, color: 'bg-orange-100 text-orange-700' } : undefined}
        collapsible
        defaultExpanded
        action={
          <button
            onClick={(e) => {
              e.stopPropagation();
              const type = inventoryItems.length > 0 ? inventoryItems[0].type : 'Products & Services';
              const path = inventoryItems.length > 0 ? inventoryItems[0].path : 'knowledge.productsOrServices';
              const icon = inventoryItems.length > 0 ? inventoryItems[0].icon : Package;
              setAddingItemType({ type, path, icon });
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-1 hover:bg-indigo-50 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        }
      >
        {inventoryItems.length > 0 ? (
          <div className="space-y-6">
            {inventoryItems.map((category) => (
              <div key={category.type}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-700 flex items-center gap-2">
                    <category.icon className="w-4 h-4" />
                    {category.type}
                    <span className="text-sm text-slate-400">({category.data.length})</span>
                  </h4>
                  <button
                    onClick={() => setAddingItemType({ type: category.type, path: category.path, icon: category.icon })}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.data.map((item: any, index: number) => (
                    <EditableInventoryCard
                      key={index}
                      item={item}
                      index={index}
                      type={category.type}
                      icon={category.icon}
                      onUpdate={(updatedItem) => handleInventoryUpdate(category.path, category.data, index, updatedItem)}
                      onRemove={() => handleInventoryRemove(category.path, category.data, index)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm mb-4">No inventory items yet</p>
            <button
              onClick={() => setAddingItemType({ type: 'Products & Services', path: 'knowledge.productsOrServices', icon: Package })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              Add Your First Item
            </button>
          </div>
        )}
      </SectionCard>

      {/* FAQs - Full Width */}
      <SectionCard
        icon={MessageSquare}
        title="Frequently Asked Questions"
        badge={persona.knowledge?.faqs?.length ? { text: `${persona.knowledge.faqs.length} FAQs`, color: 'bg-purple-100 text-purple-700' } : undefined}
        collapsible
        action={
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddingFAQ(true);
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-1 hover:bg-indigo-50 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        }
      >
        {persona.knowledge?.faqs?.length ? (
          <div className="space-y-3">
            {persona.knowledge.faqs.map((faq, index) => (
              <EditableFAQ
                key={index}
                faq={faq}
                index={index}
                onUpdate={(updatedFaq) => handleFAQUpdate(index, updatedFaq)}
                onRemove={() => handleFAQRemove(index)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm mb-4">No FAQs yet</p>
            <button
              onClick={() => setAddingFAQ(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              Add Your First FAQ
            </button>
          </div>
        )}
      </SectionCard>

      {/* Reviews - Read Only but displayed nicely */}
      {persona.industrySpecificData?.fetchedReviews?.length ? (
        <SectionCard
          icon={Star}
          title="Customer Reviews"
          badge={{ text: `${persona.industrySpecificData.fetchedReviews.length} reviews`, color: 'bg-yellow-100 text-yellow-700' }}
          collapsible
          defaultExpanded={false}
        >
          <div className="space-y-4">
            {persona.industrySpecificData.fetchedReviews.slice(0, 10).map((review: any, index: number) => {
              const author = typeof review.author === 'string' ? review.author : 'Anonymous';
              const text = typeof review.text === 'string' ? review.text : '';
              const rating = typeof review.rating === 'number' ? review.rating : 0;
              return (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-600">{author.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-sm text-slate-800">{author}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn("w-3.5 h-3.5", i < rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300")}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{text}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      {/* Add Item Dialog */}
      {addingItemType && (
        <AddItemDialog
          type={addingItemType.type}
          icon={addingItemType.icon}
          onAdd={(item) => {
            const existingItems = inventoryItems.find(i => i.path === addingItemType.path)?.data || [];
            handleInventoryAdd(addingItemType.path, existingItems, item);
          }}
          onClose={() => setAddingItemType(null)}
        />
      )}

      {/* Add FAQ Dialog */}
      {addingFAQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800">Add FAQ</h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const question = (form.elements.namedItem('question') as HTMLInputElement).value;
              const answer = (form.elements.namedItem('answer') as HTMLTextAreaElement).value;
              if (question && answer) {
                handleFAQAdd({ question, answer });
              }
            }}>
              <div className="space-y-3">
                <input
                  name="question"
                  type="text"
                  placeholder="Question *"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  required
                />
                <textarea
                  name="answer"
                  placeholder="Answer *"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setAddingFAQ(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Add FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg shadow-lg">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      )}
    </div>
  );
}
