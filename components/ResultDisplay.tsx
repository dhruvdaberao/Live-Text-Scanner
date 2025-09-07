import React, { useState, useEffect } from 'react';
import { CopyIcon, ClipboardCheckIcon } from './Icons';

interface ResultDisplayProps {
  text: string;
  isGettingAnswer: boolean;
}

const formatResponse = (text: string): string => {
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-400 font-semibold">$1</strong>');
  
  const isCode = /#include|int main\(|std::cout|using namespace std;/.test(text);
  if (isCode) {
    return `<pre><code class="language-cpp whitespace-pre-wrap font-mono text-sm">${safeText}</code></pre>`;
  }

  return `<div class="whitespace-pre-wrap">${safeText}</div>`;
};


export const ResultDisplay: React.FC<ResultDisplayProps> = ({ text, isGettingAnswer }) => {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  const handleCopy = () => {
    if (text) {
      navigator.clipboard.writeText(text);
      setHasCopied(true);
    }
  };

  const hasText = text.trim().length > 0;

  const renderContent = () => {
    const placeholderClasses = "w-full h-full flex items-center justify-center text-center italic text-gray-500";
    if (isGettingAnswer) {
      return <div className={placeholderClasses}>Getting your answer...</div>;
    }
    if (!hasText) {
      return <div className={placeholderClasses}>Scan text and press "Get Answer". The answer will appear here.</div>;
    }

    const formattedHtml = formatResponse(text);
    return <div dangerouslySetInnerHTML={{ __html: formattedHtml }} />;
  };

  return (
    <div className="border-t border-gray-700 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-300 mb-3">Answer</h2>
      <div className="relative bg-gray-900 rounded-lg">
        <div
          className="w-full min-h-[8rem] h-auto max-h-48 sm:max-h-64 p-3 sm:p-4 rounded-lg bg-transparent text-gray-300 resize-none overflow-y-auto text-base"
          aria-live="polite"
        >
          {renderContent()}
        </div>
        {hasText && !isGettingAnswer && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 rounded-md bg-gray-700 hover:bg-indigo-600 text-gray-300 hover:text-white transition-all duration-200"
            aria-label="Copy text"
          >
            {hasCopied ? <ClipboardCheckIcon /> : <CopyIcon />}
          </button>
        )}
      </div>
    </div>
  );
};