'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Play, Square, Download, RotateCcw } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { useTheme } from 'next-themes'

// Default tone.js example code
const defaultCode = `// Create a synth and connect it to the main output
const synth = new Tone.Synth().toDestination();

// Play a middle 'C' for the duration of an 8th note
synth.triggerAttackRelease("C4", "8n");

// You can also play chords
setTimeout(() => {
  synth.triggerAttackRelease("D4", "8n");
}, 500);

setTimeout(() => {
  synth.triggerAttackRelease("E4", "8n");
}, 1000);

// More complex example with a sequence
const seq = new Tone.Sequence((time, note) => {
  synth.triggerAttackRelease(note, 0.1, time);
}, ["C4", "E4", "G4", "B4"], "8n");

// Start the sequence after 2 seconds
setTimeout(() => {
  Tone.Transport.start();
  seq.start(0);
}, 2000);

// Stop after 5 seconds
setTimeout(() => {
  Tone.Transport.stop();
  seq.stop();
}, 5000);`

export default function SoundCreator() {
  const [code, setCode] = useState(defaultCode)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const { toast } = useToast()
  const { theme } = useTheme()
  const toneRef = useRef<any>(null)
  const recorderRef = useRef<any>(null)
  const recordedChunks = useRef<Blob[]>([])

  // Initialize Tone.js
  useEffect(() => {
    const initTone = async () => {
      try {
        const Tone = await import('tone')
        toneRef.current = Tone
      } catch (error) {
        console.error('Failed to load Tone.js:', error)
        toast({
          title: "Error",
          description: "Failed to load Tone.js library",
          variant: "destructive",
        })
      }
    }
    initTone()
  }, [toast])

  const startAudioContext = async () => {
    if (toneRef.current && toneRef.current.context.state !== 'running') {
      await toneRef.current.start()
    }
  }

  const playSound = async () => {
    if (!toneRef.current) {
      toast({
        title: "Error",
        description: "Tone.js is not loaded yet",
        variant: "destructive",
      })
      return
    }

    try {
      await startAudioContext()
      setIsPlaying(true)
      
      // Create a new Function to execute the user's code with Tone in scope
      const Tone = toneRef.current
      const userFunction = new Function('Tone', code)
      userFunction(Tone)
      
      toast({
        title: "Playing",
        description: "Your sound is now playing",
      })
    } catch (error) {
      console.error('Error executing code:', error)
      toast({
        title: "Code Error",
        description: `Error executing your code: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  const stopSound = () => {
    if (toneRef.current) {
      try {
        toneRef.current.Transport.stop()
        toneRef.current.Transport.cancel()
        // Dispose all current nodes to stop sounds
        toneRef.current.context.dispose()
        toneRef.current.setContext(new toneRef.current.Context())
        setIsPlaying(false)
        toast({
          title: "Stopped",
          description: "Audio playback stopped",
        })
      } catch (error) {
        console.error('Error stopping sound:', error)
        setIsPlaying(false)
      }
    }
  }

  const startRecording = async () => {
    if (!toneRef.current) return

    try {
      await startAudioContext()
      
      // Get the audio destination
      const dest = toneRef.current.context.createMediaStreamDestination()
      toneRef.current.Destination.connect(dest)
      
      // Check if WAV is supported, otherwise fall back to webm
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav' 
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm'
          : 'audio/wav' // fallback, will be converted later
      
      const mediaRecorder = new MediaRecorder(dest.stream, { mimeType })
      recordedChunks.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const recordedBlob = new Blob(recordedChunks.current, { type: mimeType })
        
        // If we recorded in webm, convert to WAV
        if (mimeType === 'audio/webm') {
          const wavBlob = await convertToWav(recordedBlob)
          downloadRecording(wavBlob)
        } else {
          downloadRecording(recordedBlob)
        }
        
        setIsRecording(false)
      }
      
      recorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      
      // Execute the code
      const Tone = toneRef.current
      const userFunction = new Function('Tone', code)
      userFunction(Tone)
      
      toast({
        title: "Recording",
        description: "Recording started. Audio will be downloaded when stopped.",
      })
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording Error",
        description: `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop()
      stopSound()
    }
  }

  const downloadRecording = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `tone-recording-${new Date().toISOString().slice(0, 19)}.wav`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast({
      title: "Downloaded",
      description: "Your recording has been downloaded",
    })
  }

  const resetCode = () => {
    setCode(defaultCode)
    toast({
      title: "Reset",
      description: "Code has been reset to default example",
    })
  }

  // Function to convert webm blob to WAV format
  const convertToWav = async (webmBlob: Blob): Promise<Blob> => {
    try {
      // Create audio context for processing
      const audioContext = new AudioContext()
      
      // Convert blob to array buffer
      const arrayBuffer = await webmBlob.arrayBuffer()
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Create WAV blob from audio buffer
      const wavBlob = audioBufferToWav(audioBuffer)
      
      audioContext.close()
      return wavBlob
    } catch (error) {
      console.error('Error converting to WAV:', error)
      // Return original blob if conversion fails
      return webmBlob
    }
  }

  // Function to convert AudioBuffer to WAV blob
  const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
    const numberOfChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const length = audioBuffer.length * numberOfChannels * 2 + 44
    
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    let pos = 0
    
    // RIFF identifier
    writeString(pos, 'RIFF'); pos += 4
    // File length minus RIFF identifier length and file description length
    view.setUint32(pos, length - 8, true); pos += 4
    // RIFF type
    writeString(pos, 'WAVE'); pos += 4
    // Format chunk identifier
    writeString(pos, 'fmt '); pos += 4
    // Format chunk length
    view.setUint32(pos, 16, true); pos += 4
    // Sample format (raw)
    view.setUint16(pos, 1, true); pos += 2
    // Channel count
    view.setUint16(pos, numberOfChannels, true); pos += 2
    // Sample rate
    view.setUint32(pos, sampleRate, true); pos += 4
    // Byte rate (sample rate * block align)
    view.setUint32(pos, sampleRate * numberOfChannels * 2, true); pos += 4
    // Block align (channel count * bytes per sample)
    view.setUint16(pos, numberOfChannels * 2, true); pos += 2
    // Bits per sample
    view.setUint16(pos, 16, true); pos += 4
    // Data chunk identifier
    writeString(pos, 'data'); pos += 4
    // Data chunk length
    view.setUint32(pos, audioBuffer.length * numberOfChannels * 2, true); pos += 4
    
    // Write the PCM samples
    const offset = pos
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]))
        view.setInt16(offset + (i * numberOfChannels + channel) * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tone.js Sound Creator</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetCode}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Write your Tone.js code below. The Tone object is available in scope.
            <a 
              href="https://tonejs.github.io/docs/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1"
            >
              View Tone.js Documentation
            </a>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <CodeMirror
              value={code}
              onChange={(value) => setCode(value)}
              extensions={[javascript()]}
              theme={theme === 'dark' ? vscodeDark : undefined}
              height="300px"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
              }}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={playSound}
              disabled={isPlaying || isRecording}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Play
            </Button>
            
            <Button
              onClick={stopSound}
              disabled={!isPlaying && !isRecording}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
            
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "secondary"}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isRecording ? "Stop Recording" : "Record & Export"}
            </Button>
          </div>

          {(isPlaying || isRecording) && (
            <div className="text-sm text-muted-foreground">
              {isRecording ? "🔴 Recording in progress..." : "▶️ Playing..."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}