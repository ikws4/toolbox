'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import CodeMirror from '@uiw/react-codemirror'
import { langs } from '@uiw/codemirror-extensions-langs'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { Play, RotateCcw, Pause, Copy, Video, Loader2, Square } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const LANGUAGE_OPTIONS = {
  'javascript': { name: 'JavaScript', extension: langs.javascript },
  'typescript': { name: 'TypeScript', extension: langs.typescript },
  'python': { name: 'Python', extension: langs.python },
  'java': { name: 'Java', extension: langs.java },
  'cpp': { name: 'C++', extension: langs.cpp },
  'csharp': { name: 'C#', extension: langs.csharp },
  'go': { name: 'Go', extension: langs.go },
  'rust': { name: 'Rust', extension: langs.rust },
  'html': { name: 'HTML', extension: langs.html },
  'css': { name: 'CSS', extension: langs.css },
}

export default function SourceCodeTyper() {
  const [sourceCode, setSourceCode] = useState('')
  const [displayedCode, setDisplayedCode] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(25)
  const currentIndexRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout>()
  const [isRecording, setIsRecording] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const codeMirrorRef = useRef<HTMLDivElement>(null)
  const [selectedLang, setSelectedLang] = useState('javascript')
  const [showLineNumbers, setShowLineNumbers] = useState(false)
  const sourceEditorRef = useRef<{ editor: any } | null>(null)
  const outputScrollRef = useRef<HTMLDivElement>(null)
  const lastTimestampRef = useRef<number | null>(null);
  const charAccumulatorRef = useRef(0);
  const [fontSize, setFontSize] = useState(16); // added fontSize config

  const scrollToBottom = useCallback(() => {
    if (outputScrollRef.current) {
      const element = outputScrollRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isSourceEditorFocused = activeElement?.closest('.source-editor') !== null
      
      if (isSourceEditorFocused) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        playFromStart()
      } else if (e.code === 'Space') {
        e.preventDefault()
        togglePause()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [sourceCode, isPlaying, isPaused])

  useEffect(() => {
    let animationFrameId: number;

    function animate(timestamp: number) {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;
      charAccumulatorRef.current += (speed * delta) / 1000;
      const charsToAdd = Math.floor(charAccumulatorRef.current);
      if (charsToAdd > 0 && currentIndexRef.current < sourceCode.length) {
        let newIndex = currentIndexRef.current;
        let charsAdded = 0;
        while (charsAdded < charsToAdd && newIndex < sourceCode.length) {
          if (sourceCode[newIndex] !== ' ') {
            charsAdded++;
          }

          newIndex++;
        }

        let current = Math.min(newIndex, sourceCode.length);
        setDisplayedCode(sourceCode.slice(0, current));
        scrollToBottom();
        currentIndexRef.current = current;
        charAccumulatorRef.current -= charsAdded; 
      }

      if (currentIndexRef.current >= sourceCode.length) {
        setIsPaused(true);
      }

      if (isPlaying && !isPaused && currentIndexRef.current < sourceCode.length) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    if (isPlaying && !isPaused) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      lastTimestampRef.current = null;
      charAccumulatorRef.current = 0;
    };
  }, [isPlaying, isPaused, sourceCode, speed]);

  const playFromStart = () => {
    setIsPlaying(true)
    setIsPaused(false)
    currentIndexRef.current = 0
    setDisplayedCode('')
  }

  const startTyping = () => {
    if (!sourceCode || isPlaying) return
    playFromStart()
  }

  const togglePause = () => {
    if (!isPlaying) return
    setIsPaused(!isPaused)
  }

  const stopTyping = () => {
    setIsPlaying(false)
    setIsPaused(false)
    currentIndexRef.current = 0
    setDisplayedCode(sourceCode)
  }

  const startRecording = async () => {
    if (!codeMirrorRef.current) return;
    setIsRecording(true)
    setIsExporting(true)

    try {
      const element = codeMirrorRef.current;
      const displaySurface = await navigator.mediaDevices.getDisplayMedia({
        preferCurrentTab: true,
      });
      const [track] = displaySurface.getVideoTracks();
  
      const restrictionTarget = await RestrictionTarget.fromElement(element);
      await track.restrictTo(restrictionTarget);

      const mediaRecorder = new MediaRecorder(displaySurface, {
        mimeType: 'video/mp4'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const currentDate = new Date().toISOString();
        a.download = `code-typing-${currentDate}.mp4`;
        a.click();
        URL.revokeObjectURL(url);
        
        displaySurface.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsExporting(false);
      };

      mediaRecorder.start();
      playFromStart();

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setIsExporting(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  useEffect(() => {
    if (isRecording && currentIndexRef.current >= sourceCode.length && isPaused) {
      setTimeout(() => {
        stopRecording()
      }, 1000);
    }
  }, [currentIndexRef, isRecording, isPaused])

  // Add paddedDisplayedCode computed variable
  const paddedDisplayedCode = (() => {
    const currentLines = displayedCode.split('\n');
    const missing = Math.max(0, 20 - currentLines.length);
    return displayedCode + '\n'.repeat(missing);
  })();

  return (
    <>
      {/* Add CSS to hide scrollbar */}
      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="space-y-4" ref={containerRef}>
        <div className="border rounded-md source-editor" className="overflow-auto hide-scrollbar" style={{ height: `${fontSize * (510/18)}px` }}>
          <CodeMirror
            ref={sourceEditorRef}
            value={sourceCode}
            onChange={setSourceCode}
            theme={vscodeDark}
            extensions={[LANGUAGE_OPTIONS[selectedLang].extension()]}
            basicSetup={{
              foldGutter: false,
              lineNumbers: true,
            }}
            
            style={{ fontSize: `${fontSize}px` }} // updated: use fontSize config
          />
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            {!isPlaying ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={startTyping}
                  disabled={!sourceCode}
                >
                  <Play className="w-4 h-4 mr-2" />Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={startRecording}
                  disabled={!sourceCode || isRecording}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4 mr-2" />
                  )}
                  Export Video
                </Button>
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(sourceCode)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={playFromStart}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />Restart
                </Button>
                <Button 
                  variant="outline" 
                  onClick={togglePause}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={stopTyping}
                >
                  <Square className="w-4 h-4 mr-2" />Stop
                </Button>
              </>
            )}
          </div>

          <div className="grid gap-4 p-4 border rounded-md">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Language:</Label>
                <Select value={selectedLang} onValueChange={setSelectedLang}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANGUAGE_OPTIONS).map(([key, { name }]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="line-numbers"
                  checked={showLineNumbers}
                  onCheckedChange={setShowLineNumbers}
                />
                <Label htmlFor="line-numbers">Line Numbers</Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label>Speed:</Label>
              {/* Replace slider with group toggle */}
              <div className="flex gap-2">
                <Button 
                  variant={speed === 10 ? 'default' : 'outline'} 
                  onClick={() => setSpeed(10)}>
                  Slow
                </Button>
                <Button 
                  variant={speed === 25 ? 'default' : 'outline'} 
                  onClick={() => setSpeed(25)}>
                  Normal
                </Button>
                <Button 
                  variant={speed === 75 ? 'default' : 'outline'} 
                  onClick={() => setSpeed(75)}>
                  Fast
                </Button>
                <Button 
                  variant={speed === 200 ? 'default' : 'outline'} 
                  onClick={() => setSpeed(200)}>
                  Flash
                </Button>
              </div>
            </div>
            {/* Removed Slider and speed text */}

            <div className="flex items-center gap-2">
              <Label>Font Size:</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={10}
                max={30}
                step={1}
                className="w-32"
              />
              <span>{fontSize}px</span>
            </div>
          </div>
        </div>

        <div 
          className="relative overflow-hidden isolate [transform-style:flat]"
          // style={{ height: `${fontSize * (513.6/18)}px` }}
          ref={codeMirrorRef}
        >
          <div 
            ref={outputScrollRef} 
            className="overflow-auto hide-scrollbar"
            style={{ height: `${fontSize * (510/18)}px` }}
          >
            <CodeMirror
              value={paddedDisplayedCode} // updated: use padded code
              theme={vscodeDark}
              extensions={[
                LANGUAGE_OPTIONS[selectedLang].extension(),
              ]}
              readOnly={true}
              basicSetup={{
                foldGutter: false,
                lineNumbers: showLineNumbers,
                highlightActiveLine: false,
              }}
              style={{ fontSize: `${fontSize}px` }} // updated: use fontSize config
            />
          </div>
        </div>
      </div>
    </>
  )
}
