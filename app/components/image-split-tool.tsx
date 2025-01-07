'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Jimp } from "jimp"
import JSZip from 'jszip'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'

export default function ImageSplitTool() {
  const [image, setImage] = useState<File | null>(null)
  const [rows, setRows] = useState(2)
  const [columns, setColumns] = useState(2)
  const [processing, setProcessing] = useState(false)
  const [splitImages, setSplitImages] = useState<string[]>([])
  const [splitedGridInfo, setSplitedGridInfo] = useState<number[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImage(acceptedFiles[0])
    setSplitImages([])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  })

  const splitImage = async () => {
    if (!image) return

    setProcessing(true)
    try {
      const jimpImg = await Jimp.read(await image.arrayBuffer())
      const width = jimpImg.width
      const height = jimpImg.height
      const pieceWidth = Math.floor(width / columns)
      const pieceHeight = Math.floor(height / rows)

      const pieces: string[] = []

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const piece = jimpImg.clone().crop({
            x: x * pieceWidth,
            y: y * pieceHeight,
            w: pieceWidth,
            h: pieceHeight
          })
          const buffer = await piece.getBuffer('image/png')
          pieces.push(URL.createObjectURL(new Blob([buffer], { type: 'image/png' })))
        }
      }
      
      setSplitImages(pieces)
      setSplitedGridInfo([rows, columns])
    } catch (error) {
      console.error('Error splitting image:', error)
    } finally {
      setProcessing(false)
    }
  }

  const downloadZip = async () => {
    const zip = new JSZip()

    splitImages.forEach((imgUrl, index) => {
      zip.file(`${index + 1}.png`, fetch(imgUrl).then(res => res.blob()))
    })

    const content = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(content)
    link.download = 'split_images.zip'
    link.click()
  }

  return (
    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      <div className="md:w-3/4 space-y-4">
        <div {...getRootProps()} className="relative border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the image here ...</p>
          ) : (
            image ? (
              <>
                <img src={URL.createObjectURL(image)} alt="Selected" className="max-w-full max-h-48 mx-auto rounded-md" />
                <p className="text-sm text-muted-foreground mt-2">{image.name}</p>
              </>
            ) : (
              <p>Drag an image here, or click to select an image</p>
            )
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rows">Rows</Label>
            <Input
              id="rows"
              type="number"
              min="1"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="columns">Columns</Label>
            <Input
              id="columns"
              type="number"
              min="1"
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value))}
            />
          </div>
        </div>
        <Button onClick={splitImage} disabled={!image || processing}>
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Split Image'
          )}
        </Button>
      </div>
      <div className="md:w-1/4 space-y-4 flex flex-col items-center">
        {splitImages.length > 0 && (
          <>
            <Card className='w-full'>
              <CardContent className="p-2">
                <div className={`grid grid-rows-${splitedGridInfo[0]} grid-cols-${splitedGridInfo[1]} gap-1`}>
                  {splitImages.map((imgUrl, index) => (
                    <img key={index} src={imgUrl} alt={`Split ${index + 1}`} className="w-full h-auto rounded-md" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button onClick={downloadZip}>Download Split Images (ZIP)</Button>
          </>
        )}
      </div>
    </div>
  )
}

