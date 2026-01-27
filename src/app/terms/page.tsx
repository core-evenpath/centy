import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for PingBox - AI-powered customer messaging platform. Read our terms and conditions for using our services.',
  alternates: {
    canonical: 'https://pingbox.io/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-stone-900 text-lg">PingBox</span>
          </Link>
          <Link href="/" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-stone-900 mb-4">Terms of Service</h1>
            <p className="text-stone-500">Last updated: January 27, 2025</p>
          </header>

          <div className="prose prose-stone max-w-none">
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                By accessing or using PingBox ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
              </p>
              <p className="text-stone-600 leading-relaxed">
                These Terms apply to all visitors, users, and others who access or use the Service. By using our Service, you agree that you have read, understood, and agree to be bound by these Terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">2. Description of Service</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                PingBox is an AI-powered customer messaging platform that provides:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li>Unified inbox for WhatsApp, Telegram, and SMS messaging</li>
                <li>AI-powered automated responses based on your business documents</li>
                <li>Document processing and knowledge base management</li>
                <li>Analytics and revenue tracking for customer conversations</li>
                <li>Smart broadcast and campaign management features</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">3. Account Registration</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                To use certain features of the Service, you must register for an account. When you register, you agree to:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="text-stone-600 leading-relaxed">
                You must be at least 18 years old or the legal age of majority in your jurisdiction to create an account and use the Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">4. Acceptable Use</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Send spam, unsolicited messages, or unauthorized advertising</li>
                <li>Harass, abuse, or harm another person or entity</li>
                <li>Upload or transmit malware, viruses, or other malicious code</li>
                <li>Interfere with or disrupt the Service or its infrastructure</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">5. User Content</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                You retain all rights to the content you upload to the Service ("User Content"), including documents, price lists, catalogs, and other materials. By uploading User Content, you grant PingBox a limited license to:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li>Process and analyze your documents to power AI responses</li>
                <li>Store your content securely on our infrastructure</li>
                <li>Use your content solely to provide and improve the Service for you</li>
              </ul>
              <p className="text-stone-600 leading-relaxed">
                You are responsible for ensuring you have the right to upload and use all User Content. We do not claim ownership of your User Content and will not use it for purposes other than providing the Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">6. AI-Generated Responses</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                Our Service uses artificial intelligence to generate responses based on your uploaded documents. You acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li>AI-generated responses may not always be accurate or complete</li>
                <li>You are responsible for reviewing and approving AI responses before they are sent</li>
                <li>PingBox is not liable for any inaccuracies in AI-generated content</li>
                <li>You should not rely solely on AI responses for critical business decisions</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">7. Payment and Billing</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                For paid subscription plans:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We may change our fees with 30 days' notice</li>
                <li>You authorize us to charge your payment method for recurring fees</li>
                <li>Failure to pay may result in suspension or termination of your account</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">8. Third-Party Integrations</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                The Service integrates with third-party platforms including WhatsApp, Telegram, and SMS providers. Your use of these integrations is subject to the respective third-party terms of service. PingBox is not responsible for the availability, reliability, or actions of third-party services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">9. Intellectual Property</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                The Service and its original content (excluding User Content), features, and functionality are owned by PingBox and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works of our Service without prior written consent.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                To the maximum extent permitted by law, PingBox shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li>Loss of profits, revenue, or data</li>
                <li>Business interruption or loss of business opportunities</li>
                <li>Damages resulting from AI-generated content</li>
                <li>Third-party service failures or outages</li>
              </ul>
              <p className="text-stone-600 leading-relaxed">
                Our total liability shall not exceed the amount paid by you for the Service in the 12 months preceding the claim.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">11. Indemnification</h2>
              <p className="text-stone-600 leading-relaxed">
                You agree to indemnify and hold harmless PingBox, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of the Service, your User Content, or your violation of these Terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">12. Termination</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, if you breach these Terms. Upon termination:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li>Your right to use the Service will cease immediately</li>
                <li>We may delete your account and User Content</li>
                <li>You may request an export of your data within 30 days</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">13. Changes to Terms</h2>
              <p className="text-stone-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">14. Governing Law</h2>
              <p className="text-stone-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Bangalore, India.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">15. Contact Us</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <ul className="list-none text-stone-600 space-y-2">
                <li><strong>Email:</strong> legal@pingbox.io</li>
                <li><strong>Website:</strong> <Link href="/" className="text-emerald-600 hover:underline">pingbox.io</Link></li>
              </ul>
            </section>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-stone-200">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-stone-900">PingBox</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-stone-500">
            <Link href="/privacy" className="hover:text-stone-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-900 transition-colors font-medium text-stone-900">Terms</Link>
            <a href="mailto:hello@pingbox.io" className="hover:text-stone-900 transition-colors">Contact</a>
          </div>
          <div className="text-sm text-stone-400">© 2025 PingBox. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
