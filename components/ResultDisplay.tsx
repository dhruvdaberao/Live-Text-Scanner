import React, { useState, useEffect } from 'react';
import { CopyIcon, ClipboardCheckIcon } from './Icons';

interface ResultDisplayProps {
  text: string;
  isGettingAnswer: boolean;
  uiOpacity: number;
}

const formatResponse = (text: string): string => {
  // Check for a markdown code block that fills the entire response.
  const codeBlockRegex = /^```(?:\w+)?\n([\s\S]+)\n```$/;
  const match = text.trim().match(codeBlockRegex);

  if (match) {
    let code = match[1];
    // Escape HTML characters for safe rendering
    code = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // The <pre> tag will be wrapped in a div with the background, so it doesn't need its own.
    return `<pre><code class="block whitespace-pre-wrap font-mono text-sm">${code}</code></pre>`;
  }
  
  // If not a code block, format for regular text display.
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-400 font-semibold">$1</strong>');
  
  return `<div class="whitespace-pre-wrap">${safeText}</div>`;
};


export const ResultDisplay: React.FC<ResultDisplayProps> = ({ text, isGettingAnswer, uiOpacity }) => {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  const handleCopy = () => {
    if (text) {
      // For code blocks, we strip the markdown fences before copying
      const codeBlockRegex = /^```(?:\w+)?\n([\s\S]+)\n```$/;
      const match = text.trim().match(codeBlockRegex);
      const textToCopy = match ? match[1] : text;
      navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
    }
  };

  const hasText = text.trim().length > 0;

  const renderContent = () => {
    const placeholderClasses = "w-full min-h-[8rem] h-full flex items-center justify-center text-center italic text-gray-500 p-4";
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
    <div className="pt-4 mt-4 border-t" style={{ borderColor: `rgba(55, 65, 81, 0.5 * ${uiOpacity / 100})`}}>
      <h2 className="text-lg font-semibold text-gray-300 mb-3">Answer</h2>
      <div className="relative rounded-lg" style={{ backgroundColor: `rgba(17, 24, 39, ${uiOpacity / 100})` }}>
        <div
          className="w-full min-h-[8rem] p-3 sm:p-4 text-gray-300 text-base overflow-x-auto"
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