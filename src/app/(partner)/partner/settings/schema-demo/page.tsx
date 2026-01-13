'use client';

import React from 'react';
import { SchemaProfileRenderer } from '@/components/partner/settings/SchemaProfileRenderer';

/**
 * Demo page to test the new Schema-Driven 6-Section Business Profile
 * 
 * Access this at: /partner/settings/schema-demo
 * 
 * The 6 Sections are:
 * 1. 🏢 Brand Identity - Who you are
 * 2. 📍 Location & Hours - Where & When  
 * 3. ⭐ Expertise & Specializations - What you do (dynamic per industry)
 * 4. 🎯 Audience & Positioning - Who you serve & why
 * 5. 🛡️ Trust & Support - Credibility + Help
 * 6. 🌐 From the Web - Scraped intelligence
 */
export default function SchemaProfileDemoPage() {
    // Demo persona data
    const [demoPersona, setDemoPersona] = React.useState({
        identity: {
            name: 'Test Business',
            industry: {
                category: 'food_beverage',
            },
        },
        personality: {
            tagline: 'Quality Food, Quality Service',
            description: 'A demo restaurant showcasing the schema-driven profile system.',
            foundedYear: '2020',
        },
        location: {
            address: '123 Demo Street, Test City',
            timezone: 'Asia/Kolkata',
        },
        industrySpecificData: {
            cuisineTypes: ['Italian', 'Mediterranean'],
            mealPeriods: ['Lunch', 'Dinner'],
            serviceStyles: ['Dine-in', 'Takeaway'],
            dietaryOptions: ['Vegetarian options available', 'Vegan options'],
        },
        communications: {
            responseTime: 'within 2 hours',
            languages: ['English', 'Hindi'],
        },
        support: {
            faqs: [
                { question: 'What are your hours?', answer: 'We are open 11am-10pm daily.' },
                { question: 'Do you offer delivery?', answer: 'Yes, through major delivery apps.' },
            ],
        },
    });

    const handleUpdate = async (path: string, value: any) => {
        console.log(`[Schema Demo] Update: ${path} =`, value);
        // In real implementation, this would update Firebase
        // For demo, just update local state
        const keys = path.split('.');
        setDemoPersona((prev) => {
            const result = { ...prev };
            let current: any = result;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return result;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        🧪 Schema-Driven Profile Demo
                    </h1>
                    <p className="text-slate-600">
                        Testing the new 6-section Business Profile structure
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                            Industry: Food & Beverage
                        </span>
                    </div>
                </div>

                {/* Industry Selector */}
                <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Test with Different Industry:
                    </label>
                    <select
                        className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg"
                        value={demoPersona.identity.industry.category}
                        onChange={(e) => {
                            setDemoPersona((prev) => ({
                                ...prev,
                                identity: {
                                    ...prev.identity,
                                    industry: {
                                        ...prev.identity.industry,
                                        category: e.target.value,
                                    },
                                },
                            }));
                        }}
                    >
                        <option value="food_beverage">🍕 Food & Beverage</option>
                        <option value="retail">🛒 Retail</option>
                        <option value="healthcare">🏥 Healthcare</option>
                        <option value="education">🎓 Education</option>
                        <option value="hospitality">✈️ Hospitality</option>
                        <option value="real_estate">🏠 Real Estate</option>
                        <option value="services">💼 Professional Services</option>
                        <option value="beauty_wellness">💅 Beauty & Wellness</option>
                        <option value="finance">💰 Finance</option>
                        <option value="technology">💻 Technology</option>
                        <option value="automotive">🚗 Automotive</option>
                        <option value="events">🎉 Events</option>
                        <option value="home_services">🔧 Home Services</option>
                        <option value="manufacturing">🏭 Manufacturing</option>
                        <option value="other">📦 Other</option>
                    </select>
                </div>

                {/* Schema Profile Renderer */}
                <SchemaProfileRenderer
                    persona={demoPersona as any}
                    industryId={demoPersona.identity.industry.category}
                    onUpdate={handleUpdate}
                />

                {/* Debug Panel */}
                <div className="mt-8 bg-slate-800 rounded-xl p-4 text-white">
                    <h3 className="font-medium mb-2">Debug: Current Persona State</h3>
                    <pre className="text-xs overflow-auto max-h-60 text-slate-300">
                        {JSON.stringify(demoPersona, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
