
'use client';

import { useState } from 'react';
import { saveEarlyAccessSignupAction } from '../../actions/early-access-actions';
import { useToast } from '../../hooks/use-toast';

export default function EarlyAccessPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const result = await saveEarlyAccessSignupAction(formData);
        
        if (result.success) {
            setIsSubmitted(true);
            toast({
                title: 'Success!',
                description: "You're on the list. We'll be in touch soon.",
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description: error.message || 'An unknown error occurred.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full">
        <div className="text-6xl text-center mb-5">🎯</div>
        
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-3">
          Get Early Access
        </h1>
        
        <p className="text-gray-600 text-center mb-8 leading-relaxed">
          Be among the first to experience our new app. Join our exclusive waitlist today!
        </p>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-base"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-base"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        ) : (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-xl text-center">
            ✓ You're on the list! We'll be in touch soon.
          </div>
        )}

        <p className="text-gray-400 text-sm text-center mt-6">
          No spam, we promise. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
