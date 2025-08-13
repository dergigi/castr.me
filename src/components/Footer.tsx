import React from 'react';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/favicon-32x32.png"
                alt="castr.me logo"
                width={24}
                height={24}
                className="flex-shrink-0"
              />
              <span className="text-sm font-semibold text-gray-700">castr.me</span>
            </a>
          </div>
          <p className="text-sm text-gray-500">
            Made with love by{' '}
            <a 
              href="https://npub.world/npub1dergggklka99wwrs92yz8wdjs952h2ux2ha2ed598ngwu9w7a6fsh9xzpc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Gigi
            </a> - okay... vibed with love.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Birthed during{' '}
            <a 
              href="https://sovereignengineering.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 hover:underline"
            >
              SEC-04
            </a>{' '}
            &middot;{' '}
            <a 
              href="https://github.com/dergigi/pubcaster" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 hover:underline"
            >
              GitHub
            </a>{' '}
            &middot;{' '}
            <a 
              href="https://njump.me/npub196qvw7utjs0cnztlg4aww98ekql9svm6c4wlv6sug70nzz0uujxsprafme" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 hover:underline"
            >
              Nostr
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 