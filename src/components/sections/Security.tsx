import { Shield, Lock, Key, Eye, Server, Shield as ShieldCheck } from 'lucide-react';

export function Security() {
  const securityFeatures = [
    {
      icon: <Key className="w-6 h-6 text-green-600" />,
      title: "Client-Side Key Generation",
      description: "Encryption keys are generated on your device and never transmitted in unencrypted form."
    },
    {
      icon: <Lock className="w-6 h-6 text-green-600" />,
      title: "End-to-End Encryption",
      description: "Your data is encrypted before it leaves your device and can only be decrypted by you."
    },
    {
      icon: <Eye className="w-6 h-6 text-green-600" strokeWidth={2} />,
      title: "Searchable Encryption",
      description: "Advanced DCPE keys enable secure, searchable encryption while maintaining privacy."
    },
    {
      icon: <Server className="w-6 h-6 text-green-600" />,
      title: "No Server-Side Data Processing",
      description: "All data processing happens on your device, not on our servers."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
      title: "Recovery Key Protection",
      description: "Backup recovery keys ensure you never lose access to your encrypted data."
    },
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: "Zero-Knowledge Architecture",
      description: "We can't access your data, even if compelled by law enforcement."
    }
  ];

  return (
    <section id="security" className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Security First
          </p>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Built with Security by Design
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Our zero-trust architecture ensures that your confidential data remains secure and private at all times
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-blue-600 px-4 py-1.5 rounded-full text-white text-sm font-semibold">
              Security Features
            </div>
          </div>
        </div>
        
        <div className="mt-12 grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="flex items-start">
              <div className="shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-white">
                {feature.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-20 bg-blue-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-12 sm:p-16 text-center sm:text-left">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-1">
                <h3 className="text-xl font-bold text-white sm:text-2xl">
                  Your data deserves the best protection.
                </h3>
                <p className="mt-2 text-sm text-blue-200 sm:text-base max-w-md mx-auto sm:mx-0">
                  With our advanced encryption technology, you can use AI capabilities without risking your data privacy.
                </p>
              </div>
              <div className="mt-6 sm:mt-0 sm:ml-6 sm:flex-shrink-0 flex justify-center">
                <div className="inline-flex rounded-md shadow">
                  <a
                    href="/sign-up"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-900 bg-white hover:bg-blue-50"
                  >
                    Get started now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
