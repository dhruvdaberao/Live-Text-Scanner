import React, { useState, useRef, useCallback, useEffect } from 'react';
import { extractTextFromImage, getAnswerFromText } from './services/geminiService';
import { ResultDisplay } from './components/ResultDisplay';
import { CameraIcon, MagnifyingGlassIcon, StopIcon } from './components/Icons';

const App: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [scannedTexts, setScannedTexts] = useState<string[]>([]);
  const [apiResponse, setApiResponse] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isGettingAnswer, setIsGettingAnswer] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(false);
  const [isCoolingDown, setIsCoolingDown] = useState<boolean>(false);
  const [isAnswerCoolingDown, setIsAnswerCoolingDown] = useState<boolean>(false);
  const [uiOpacity, setUiOpacity] = useState(85);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelScanRef = useRef(false);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setCameraAvailable(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please grant permission and try again.');
      setIsCameraActive(false);
    }
  }, []);

  const handleCancelScan = () => {
    cancelScanRef.current = true;
    setIsScanning(false);
  };

  const handleScanFrame = useCallback(async () => {
    if (isScanning || !videoRef.current || !canvasRef.current || !isCameraActive || isCoolingDown) return;

    cancelScanRef.current = false;
    setIsScanning(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
        
        try {
            const text = await extractTextFromImage(base64Image);
            if (cancelScanRef.current) {
                console.log("Scan cancelled by user.");
                return;
            }
            if (text && text.trim().length > 0) {
              setScannedTexts(prev => [...prev, text.trim()]);
            }
        } catch (apiError: any) {
            if (cancelScanRef.current) return;
            console.error('Gemini API error:', apiError);
            let errorMessage = 'Failed to extract text. Please try again.';
            if (apiError instanceof Error && (apiError.message.includes('429') || apiError.message.includes('RESOURCE_EXHAUSTED'))) {
                errorMessage = 'API is busy. Please wait a moment before scanning again.';
            }
            setError(errorMessage);
        } finally {
            if (!cancelScanRef.current) {
                setIsCoolingDown(true);
                setTimeout(() => setIsCoolingDown(false), 5000);
            }
            setIsScanning(false);
        }
    } else {
        setIsScanning(false);
    }
  }, [isScanning, isCameraActive, isCoolingDown]);

  const handleGetAnswer = useCallback(async () => {
    if (scannedTexts.length === 0 || isGettingAnswer || isAnswerCoolingDown) return;
    setIsGettingAnswer(true);
    setError(null);
    setApiResponse('');
    try {
      const fullQuestion = scannedTexts.join(' ');
      const answer = await getAnswerFromText(fullQuestion);
      setApiResponse(answer);
    } catch (apiError: any) {
      console.error('Error getting answer:', apiError);
      let errorMessage = 'Could not get an answer. Please try again.';
       if (apiError instanceof Error && (apiError.message.includes('429') || apiError.message.includes('RESOURCE_EXHAUSTED'))) {
          errorMessage = 'API is busy. Please wait a moment before trying again.';
      }
      setError(errorMessage);
    } finally {
      setIsGettingAnswer(false);
      setIsAnswerCoolingDown(true);
      setTimeout(() => setIsAnswerCoolingDown(false), 5000);
    }
  }, [scannedTexts, isGettingAnswer, isAnswerCoolingDown]);

  const handleClearTexts = () => {
    setScannedTexts([]);
    setApiResponse('');
    setError(null);
  };
  
  const handleToggleCamera = useCallback(() => {
    if (isCameraActive) {
      setIsCameraActive(false);
      stopCamera();
    } else {
      setIsCameraActive(true);
      handleClearTexts();
      startCamera();
    }
  }, [isCameraActive, stopCamera, startCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!isCameraActive) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-700/[0.2] bg-[length:12px_12px]"></div>
        <div className="w-full max-w-2xl mx-auto z-10 text-center">
           <header className="my-6 flex flex-col items-center">
             <div className="w-24 h-24 sm:w-28 sm:h-28 mb-6 bg-indigo-600/20 rounded-full flex items-center justify-center ring-1 ring-indigo-500/30">
                <img src="/racoon-raccoon.gif" alt="App Logo" className="w-full h-full rounded-full object-cover" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Live Q&A Scanner
            </h1>
            <p className="text-gray-400 mt-2">Scan text piece by piece, then get your answer.</p>
          </header>
          <main className="my-8">
             <button
              onClick={handleToggleCamera}
              disabled={!cameraAvailable}
              className={`flex items-center justify-center gap-3 text-lg font-semibold py-4 px-8 rounded-full transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-4 mx-auto
              ${!cameraAvailable 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white ring-indigo-500/50'
              }`}
            >
              <CameraIcon /> Start Camera
            </button>
            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
            {!cameraAvailable && <p className="text-yellow-400 text-center mt-4">Camera not found or supported on this device.</p>}
          </main>
          <footer className="my-6 text-gray-500 text-sm">
            <p>Powered by Gemini. Built with React & Tailwind CSS.</p>
          </footer>
        </div>
      </div>
    );
  }
  
  const getAnswerDisabled = isGettingAnswer || scannedTexts.length === 0 || isAnswerCoolingDown;

  return (
    <div className="h-dvh w-screen bg-black flex flex-col font-sans overflow-hidden">
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div 
            ref={panelRef}
            className={`absolute left-0 right-0 rounded-t-2xl z-10 shadow-2xl shadow-black/50 flex flex-col transition-all duration-300 ease-out`}
            style={{ 
              backgroundColor: `rgba(31, 41, 55, ${uiOpacity / 100})`,
              transform: isPanelExpanded ? 'translateY(0)' : 'translateY(calc(100% - 220px))',
              bottom: isPanelExpanded ? `0` : `calc(-85vh + 220px)`
            }}
        >
          <div 
              className="w-full flex justify-center py-3 cursor-grab"
          >
              <div className="w-10 h-1.5 rounded-full" style={{ backgroundColor: `rgba(107, 114, 128, ${uiOpacity/100})`}}></div>
          </div>
            <div className="flex-shrink-0 px-4 pb-3 space-y-3 border-b" style={{ borderColor: `rgba(55, 65, 81, ${uiOpacity / 100})`}}>
                {isScanning ? (
                    <button
                        onClick={handleCancelScan}
                        className="w-full flex items-center justify-center gap-3 text-lg font-semibold py-3 px-6 rounded-lg transition-colors duration-300 transform active:scale-95 focus:outline-none focus:ring-4 text-white ring-amber-500/50"
                        style={{ backgroundColor: `rgba(217, 119, 6, ${uiOpacity / 100})`}}
                        aria-label="Stop processing"
                    >
                        <StopIcon className="w-6 h-6"/>
                        <span>Stop Processing</span>
                    </button>
                ) : (
                    <button 
                        onClick={handleScanFrame}
                        disabled={isCoolingDown}
                        className="w-full flex items-center justify-center gap-3 text-lg font-semibold py-3 px-6 rounded-lg transition-colors duration-300 transform active:scale-95 focus:outline-none focus:ring-4 text-white ring-indigo-500/50 disabled:text-gray-400 disabled:cursor-not-allowed"
                        style={{ 
                            backgroundColor: isCoolingDown 
                                ? `rgba(75, 85, 99, ${uiOpacity / 100})` 
                                : `rgba(79, 70, 229, ${uiOpacity / 100})`
                        }}
                        aria-label="Scan text from frame"
                    >
                        <MagnifyingGlassIcon className="w-6 h-6"/>
                        <span>Scan Frame</span>
                    </button>
                )}
                 <button
                    onClick={handleToggleCamera}
                    className="w-full flex items-center justify-center gap-3 text-lg font-semibold py-3 px-6 rounded-lg transition-colors duration-300 transform active:scale-95 focus:outline-none focus:ring-4 text-white ring-red-500/50"
                    style={{ backgroundColor: `rgba(220, 38, 38, ${uiOpacity / 100})`}}
                >
                    <CameraIcon /> Stop Camera
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 max-h-[calc(85vh-220px)]">
                 <div className="mb-4">
                    <label htmlFor="opacity-slider" className="block text-sm font-medium text-gray-300 mb-1">UI Transparency</label>
                    <input 
                        id="opacity-slider" 
                        type="range" 
                        min="30" 
                        max="100" 
                        value={uiOpacity} 
                        onChange={(e) => setUiOpacity(Number(e.target.value))} 
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{ backgroundColor: `rgba(55, 65, 81, ${uiOpacity / 100})`}}
                    />
                </div>

                {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                
                {scannedTexts.length > 0 && (
                    <div className="mb-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-base font-semibold text-gray-300">Scanned Text</h2>
                            <button onClick={handleClearTexts} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Clear</button>
                        </div>
                        <div 
                            className="rounded-lg p-2 max-h-40 overflow-y-auto space-y-2"
                            style={{ backgroundColor: `rgba(17, 24, 39, ${uiOpacity / 100})` }}
                        >
                            {scannedTexts.map((text, index) => (
                            <p key={index} className={`text-gray-300 p-2 rounded-md text-sm ${index === scannedTexts.length - 1 ? 'animate-highlight' : ''}`}>
                                {text}
                            </p>
                            ))}
                        </div>
                        <button
                            onClick={handleGetAnswer}
                            disabled={getAnswerDisabled}
                            className="w-full mt-3 flex items-center justify-center gap-3 text-lg font-semibold py-3 px-6 rounded-lg transition-colors duration-300 transform active:scale-95 focus:outline-none focus:ring-4 text-white ring-green-500/50 disabled:text-gray-400 disabled:cursor-not-allowed"
                            style={{ 
                                backgroundColor: getAnswerDisabled 
                                    ? `rgba(75, 85, 99, ${uiOpacity / 100})` 
                                    : `rgba(22, 163, 74, ${uiOpacity / 100})`
                            }}
                        >
                            {isGettingAnswer ? (
                            <>
                                <div className="w-5 h-5 border-2 border-t-white border-transparent rounded-full animate-spin"></div>
                                <span>Getting Answer...</span>
                            </>
                            ) : 'Get Answer'}
                        </button>
                    </div>
                )}

                <ResultDisplay text={apiResponse} isGettingAnswer={isGettingAnswer} uiOpacity={uiOpacity} />
            </div>
        </div>
    </div>
  );
};

export default App;