import React, { useState, useRef, useCallback, useEffect } from 'react';
import { extractTextFromImage, getAnswerFromText } from './services/geminiService';
import { ResultDisplay } from './components/ResultDisplay';
import { CameraIcon, PencilPaperIcon, MagnifyingGlassIcon } from './components/Icons';

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const handleScanFrame = useCallback(async () => {
    if (isScanning || !videoRef.current || !canvasRef.current || !isCameraActive || isCoolingDown) return;

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
            if (text && text.trim().length > 0) {
              setScannedTexts(prev => [...prev, text.trim()]);
            }
        } catch (apiError: any) {
            console.error('Gemini API error:', apiError);
            let errorMessage = 'Failed to extract text. Please try again.';
            if (apiError instanceof Error && (apiError.message.includes('429') || apiError.message.includes('RESOURCE_EXHAUSTED'))) {
                errorMessage = 'API is busy. Please wait a moment before scanning again.';
            }
            setError(errorMessage);
        } finally {
            setIsScanning(false);
            setIsCoolingDown(true);
            setTimeout(() => setIsCoolingDown(false), 5000);
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
           <header className="my-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-white flex items-center justify-center gap-3">
              <PencilPaperIcon />
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

  return (
    <div className="h-screen w-screen bg-black flex flex-col font-sans overflow-hidden">
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-x-0 bottom-20 flex justify-center z-20">
            <button 
                onClick={handleScanFrame}
                disabled={isScanning || isCoolingDown}
                className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 text-white flex items-center justify-center transition-all duration-200 transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed group"
                aria-label="Scan text from frame"
            >
                {isScanning ? (
                <div className="w-10 h-10 border-4 border-t-white border-transparent rounded-full animate-spin"></div>
                ) : (
                <MagnifyingGlassIcon className="w-10 h-10 group-hover:scale-110 transition-transform"/>
                )}
            </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gray-800/80 backdrop-blur-lg rounded-t-2xl z-10 max-h-[75vh] flex flex-col shadow-2xl shadow-black/50">
            <div className="flex-shrink-0 p-4 border-b border-gray-700/50">
                 <button
                    onClick={handleToggleCamera}
                    className="w-full flex items-center justify-center gap-3 text-lg font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-4 bg-red-600 hover:bg-red-700 text-white ring-red-500/50"
                >
                    <CameraIcon /> Stop Camera
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4">
                {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                
                {scannedTexts.length > 0 && (
                    <div className="mb-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-base font-semibold text-gray-300">Scanned Text</h2>
                            <button onClick={handleClearTexts} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Clear</button>
                        </div>
                        <div className="bg-gray-900/70 rounded-lg p-2 max-h-32 overflow-y-auto space-y-2">
                            {scannedTexts.map((text, index) => (
                            <p key={index} className={`text-gray-300 p-2 rounded-md text-sm ${index === scannedTexts.length - 1 ? 'animate-highlight' : ''}`}>
                                {text}
                            </p>
                            ))}
                        </div>
                        <button
                            onClick={handleGetAnswer}
                            disabled={isGettingAnswer || scannedTexts.length === 0 || isAnswerCoolingDown}
                            className="w-full mt-3 flex items-center justify-center gap-3 text-lg font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-4 bg-green-600 hover:bg-green-700 text-white ring-green-500/50 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
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

                <ResultDisplay text={apiResponse} isGettingAnswer={isGettingAnswer} />
            </div>
        </div>
    </div>
  );
};

export default App;