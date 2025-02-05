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
  const [speed, setSpeed] = useState(50)
  const currentIndexRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout>()
  const [isRecording, setIsRecording] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const codeMirrorRef = useRef<HTMLDivElement>(null)
  const [selectedLang, setSelectedLang] = useState('javascript')
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const sourceEditorRef = useRef<{ editor: any } | null>(null)
  const outputScrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (outputScrollRef.current) {
      const element = outputScrollRef.current;
      const scrollHeight = element.scrollHeight;
      const height = element.clientHeight;
      const maxScroll = scrollHeight - height;
      element.scrollTop = maxScroll; // Center the content
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
    if (isPlaying && !isPaused && currentIndexRef.current < sourceCode.length) {
      timerRef.current = setTimeout(() => {
        setDisplayedCode(sourceCode.slice(0, currentIndexRef.current + 1))
        currentIndexRef.current += 1
      }, 1000 / speed)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isPlaying, isPaused, displayedCode, sourceCode, speed])

  useEffect(() => {
    if (isPlaying && !isPaused) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [displayedCode, scrollToBottom]);

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
      const rect = element.getBoundingClientRect();
      const displaySurface = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
          frameRate: 30,
          width: rect.width,
          height: rect.height,
          cursor: "never"
        }
      });

      const mediaRecorder = new MediaRecorder(displaySurface, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'code-typing.webm';
        a.click();
        URL.revokeObjectURL(url);
        
        displaySurface.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsExporting(false);
      };

      mediaRecorder.start();
      playFromStart();

      alert('Please select the code viewer area in the screen share dialog');
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
    if (isRecording && !isPaused && currentIndexRef.current >= sourceCode.length) {
      stopRecording()
    }
  }, [currentIndexRef.current, sourceCode.length, isRecording, isPaused])

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="border rounded-md source-editor">
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
          className="min-h-[200px]"
          style={{ fontSize: '14px' }}
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
            <Slider
              className="w-[200px]"
              value={[speed]}
              onValueChange={([value]) => setSpeed(value)}
              min={1}
              max={100}
              step={1}
            />
            <span className="text-sm w-16">{speed} c/s</span>
          </div>
        </div>
      </div>

      <div 
        className="border rounded-md relative max-h-[400px] overflow-hidden" 
        ref={codeMirrorRef}
      >
        <div ref={outputScrollRef} className="overflow-auto h-[400px]">
          <CodeMirror
            value={displayedCode}
            theme={vscodeDark}
            extensions={[
              LANGUAGE_OPTIONS[selectedLang].extension(),
            ]}
            basicSetup={{
              foldGutter: false,
              lineNumbers: showLineNumbers,
              highlightActiveLine: false,
            }}
            style={{ fontSize: '14px' }}
          />
        </div>
      </div>
    </div>
  )
}
