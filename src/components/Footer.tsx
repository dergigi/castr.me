import React from 'react';

interface FooterProps {
  version: string;
  commitHash: string;
}

const Footer: React.FC<FooterProps> = ({ version, commitHash }) => {
  return (
    <footer className="py-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-500">
            made with vibes and love
          </p>
          <div className="mt-2 text-xs text-gray-400">
            <span className="mr-2">v{version}</span>
            <span className="font-mono">{commitHash.slice(0, 7)}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 