import React from 'react';
import { LockIcon, MessageSquare, FileText, Mail, Users } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md shadow-black/5 border border-gray-100 p-6 transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-lg mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export function Features() {
  const features = [
    {
      icon: <LockIcon className="w-6 h-6 text-blue-600" />,
      title: "Client-Side Encryption",
      description: "Your data is encrypted on your device before it ever leaves, ensuring complete privacy and security."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
      title: "Chat Mode",
      description: "Interact with your confidential documents through a secure chat interface powered by AI."
    },
    {
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      title: "Email Mode",
      description: "Process and analyze your emails securely without exposing sensitive information."
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: "Meeting Mode",
      description: "Summarize and extract insights from meeting transcripts while maintaining confidentiality."
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      title: "Document Mode",
      description: "Process and interact with your document collection."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Zero-Trust Architecture",
      description: "Built on security-by-design principles ensuring your information never leaves your control."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Powerful Features, Complete Privacy
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Apply the power of generative AI to your confidential data without compromising security or privacy
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              icon={feature.icon} 
              title={feature.title} 
              description={feature.description} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
