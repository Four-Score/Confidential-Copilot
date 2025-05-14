import { Button } from '../ui/Button';
import Link from 'next/link';

export function CTA() {
  return (
    <section id="about" className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-12 md:p-12 lg:py-16 lg:px-20 flex flex-col lg:flex-row justify-between items-center">
            <div className="lg:max-w-xl">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                <span className="block">Ready to secure your AI interactions?</span>
                <span className="block text-blue-200">Start using Confidential Copilot today.</span>
              </h2>
              <p className="mt-4 text-lg text-blue-100 max-w-md">
                Join organizations that prioritize data security while leveraging the power of AI. Your data stays private, always.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/sign-up">
                  <Button size="lg" className="px-8 py-6 text-lg font-medium bg-white text-blue-600 hover:bg-blue-50">
                    Sign up for free
                  </Button>
                </Link>
                <Link href="/log-in">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-medium bg-transparent border-white text-white hover:bg-blue-700">
                    Log in
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:block relative w-80 h-80">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 bg-white/20 rounded-full filter blur-2xl"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-40 h-40 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Frequently Asked Questions
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              Everything you need to know about Confidential Copilot
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto divide-y divide-gray-200">
            {[
              {
                question: "How does client-side encryption work?",
                answer: "Our system generates encryption keys directly on your device. These keys never leave your browser in unencrypted form. All sensitive data is encrypted before being sent to our servers, ensuring that only you can access your information."
              },
              {
                question: "Can I use this with my existing documents?",
                answer: "Yes! You can upload existing documents like PDFs, and our system will encrypt them client-side before storing them. You can also use our system with websites and YouTube transcripts through our unencrypted pipeline, where the embeddings are still encrypted."
              },
              {
                question: "Is this suitable for sensitive business information?",
                answer: "Absolutely. Our zero-trust architecture was designed specifically for businesses handling sensitive information. Your data remains encrypted end-to-end, making it suitable for confidential business documents, legal materials, and more."
              },
              {
                question: "What happens if I lose my encryption keys?",
                answer: "During setup, we provide you with a recovery key that you should store securely. This key can be used to recover access to your encrypted data if you lose your primary keys."
              },
            ].map((faq, index) => (
              <div key={index} className="pt-6 pb-8">
                <dt className="text-lg">
                  <h3 className="font-medium text-gray-900">{faq.question}</h3>
                </dt>
                <dd className="mt-2 text-gray-600">{faq.answer}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
