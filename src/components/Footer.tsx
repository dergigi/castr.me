import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-500">
            Made with vibes and love by{' '}
            <a 
              href="https://sovereignengineering.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              #SovEng
            </a>{' '}
            people
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Birthed during SEC-04 &middot;{' '}
            <a 
              href="https://github.com/dergigi/pubcaster" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 hover:underline"
            >
              Source
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 