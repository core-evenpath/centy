import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for PingBox - Learn how we collect, use, and protect your data on our AI-powered customer messaging platform.',
  alternates: {
    canonical: 'https://pingbox.io/privacy',
  },
};

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-bold text-stone-900 mb-4">Privacy Policy</h1>
            <p className="text-stone-500">Last updated: January 27, 2025</p>
          </header>

          <div className="prose prose-stone max-w-none">
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">1. Introduction</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                PingBox ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered customer messaging platform.
              </p>
              <p className="text-stone-600 leading-relaxed">
                By using PingBox, you agree to the collection and use of information in accordance with this policy. If you do not agree with the practices described in this policy, please do not use our Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium text-stone-800 mb-3 mt-6">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, company name, and billing information when you create an account</li>
                <li><strong>Business Documents:</strong> Product catalogs, price lists, FAQs, and other documents you upload to power AI responses</li>
                <li><strong>Communication Data:</strong> Messages sent and received through connected channels (WhatsApp, Telegram, SMS)</li>
                <li><strong>Support Communications:</strong> Information you provide when contacting our support team</li>
              </ul>

              <h3 className="text-xl font-medium text-stone-800 mb-3 mt-6">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li><strong>Usage Data:</strong> How you interact with our Service, including features used, pages visited, and actions taken</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address</li>
                <li><strong>Analytics Data:</strong> Conversation metrics, response rates, and performance statistics</li>
                <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to enhance your experience</li>
              </ul>

              <h3 className="text-xl font-medium text-stone-800 mb-3 mt-6">2.3 Information from Third Parties</h3>
              <ul className="list-disc pl-6 text-stone-600 space-y-2">
                <li><strong>Messaging Platforms:</strong> Data received through WhatsApp Business API, Telegram Bot API, and SMS gateways</li>
                <li><strong>Payment Processors:</strong> Transaction information from payment providers</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2">
                <li><strong>Provide the Service:</strong> Process your documents, generate AI responses, and deliver messages across channels</li>
                <li><strong>Improve the Service:</strong> Analyze usage patterns to enhance features and user experience</li>
                <li><strong>Personalization:</strong> Customize the Service based on your business needs and preferences</li>
                <li><strong>Communication:</strong> Send service updates, security alerts, and support messages</li>
                <li><strong>Analytics:</strong> Generate reports and insights about your customer conversations</li>
                <li><strong>Billing:</strong> Process payments and manage your subscription</li>
                <li><strong>Legal Compliance:</strong> Comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">4. AI Processing and Data Usage</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                Our AI system processes your data to provide intelligent responses. Here's how we handle this:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li><strong>Document Processing:</strong> Your uploaded documents are analyzed to extract information for AI responses</li>
                <li><strong>Conversation Context:</strong> AI uses conversation history to provide contextually relevant responses</li>
                <li><strong>No Training on Your Data:</strong> We do not use your business documents or conversations to train general AI models</li>
                <li><strong>Data Isolation:</strong> Your data is kept separate and is only used to provide the Service to you</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2">
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate the Service (hosting, payment processing, analytics)</li>
                <li><strong>Messaging Platforms:</strong> WhatsApp, Telegram, and SMS providers to deliver your messages</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
              </ul>
              <p className="text-stone-600 leading-relaxed mt-4">
                We do not sell your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">6. Data Security</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2">
                <li><strong>Encryption:</strong> Data is encrypted in transit (TLS/SSL) and at rest (AES-256)</li>
                <li><strong>Access Controls:</strong> Strict authentication and authorization for data access</li>
                <li><strong>Infrastructure Security:</strong> Secure cloud infrastructure with regular security audits</li>
                <li><strong>Employee Training:</strong> Staff training on data protection and privacy practices</li>
                <li><strong>Incident Response:</strong> Procedures for detecting and responding to security incidents</li>
              </ul>
              <p className="text-stone-600 leading-relaxed mt-4">
                While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">7. Data Retention</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                We retain your information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li>Provide the Service and maintain your account</li>
                <li>Comply with legal obligations and resolve disputes</li>
                <li>Enforce our agreements and protect our rights</li>
              </ul>
              <p className="text-stone-600 leading-relaxed">
                When you delete your account, we will delete or anonymize your data within 30 days, except where we are required to retain it for legal purposes.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">8. Your Rights and Choices</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your data</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="text-stone-600 leading-relaxed">
                To exercise these rights, please contact us at privacy@pingbox.io. We will respond to your request within 30 days.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">9. Cookies and Tracking Technologies</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
                <li>Keep you logged in and remember your preferences</li>
                <li>Understand how you use our Service</li>
                <li>Improve performance and user experience</li>
                <li>Analyze traffic and usage patterns</li>
              </ul>
              <p className="text-stone-600 leading-relaxed">
                You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of the Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">10. International Data Transfers</h2>
              <p className="text-stone-600 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">11. Children's Privacy</h2>
              <p className="text-stone-600 leading-relaxed">
                Our Service is not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">12. Third-Party Links</h2>
              <p className="text-stone-600 leading-relaxed">
                Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any information.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">13. Changes to This Policy</h2>
              <p className="text-stone-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-stone-900 mb-4">14. Contact Us</h2>
              <p className="text-stone-600 leading-relaxed mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none text-stone-600 space-y-2">
                <li><strong>Email:</strong> privacy@pingbox.io</li>
                <li><strong>Data Protection Officer:</strong> dpo@pingbox.io</li>
                <li><strong>Website:</strong> <Link href="/" className="text-emerald-600 hover:underline">pingbox.io</Link></li>
              </ul>
            </section>

            <section className="mb-10 bg-emerald-50 border border-emerald-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-emerald-800 mb-3">Your Privacy Matters</h2>
              <p className="text-emerald-700 leading-relaxed">
                At PingBox, we believe in transparency and giving you control over your data. If you ever have questions about how we handle your information, don't hesitate to reach out.
              </p>
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
            <Link href="/privacy" className="hover:text-stone-900 transition-colors font-medium text-stone-900">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-900 transition-colors">Terms</Link>
            <a href="mailto:hello@pingbox.io" className="hover:text-stone-900 transition-colors">Contact</a>
          </div>
          <div className="text-sm text-stone-400">© 2025 PingBox. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
