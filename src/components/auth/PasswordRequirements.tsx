interface PasswordRequirement {
    label: string;
    met: boolean;
  }
  
  interface PasswordRequirementsProps {
    password: string;
  }
  
  export function PasswordRequirements({ password }: PasswordRequirementsProps) {
    const requirements: PasswordRequirement[] = [
      {
        label: 'At least 8 characters long',
        met: password.length >= 8,
      },
      {
        label: 'Contains an uppercase letter',
        met: /[A-Z]/.test(password),
      },
      {
        label: 'Contains a lowercase letter',
        met: /[a-z]/.test(password),
      },
      {
        label: 'Contains a number',
        met: /[0-9]/.test(password),
      },
      {
        label: 'Contains a special character',
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
    ];
  
    return (
      <div className="mt-2 space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center ${
                req.met ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              {req.met && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={req.met ? 'text-gray-800' : 'text-gray-500'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    );
  }