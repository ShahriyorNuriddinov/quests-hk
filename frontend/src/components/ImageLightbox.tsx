import * as Dialog from '@radix-ui/react-dialog'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface Props {
  images: string[]
  startIndex?: number
  trigger: React.ReactNode
}

export default function ImageLightbox({ images, startIndex = 0, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(startIndex)

  function openAt(i: number) {
    setIdx(i)
    setOpen(true)
  }

  function prev(e: React.MouseEvent) {
    e.stopPropagation()
    setIdx(i => (i - 1 + images.length) % images.length)
  }

  function next(e: React.MouseEvent) {
    e.stopPropagation()
    setIdx(i => (i + 1) % images.length)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild onClick={() => openAt(startIndex)}>
        {trigger}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/90 z-[100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed inset-0 z-[101] flex items-center justify-center p-4 focus:outline-none"
          onClick={() => setOpen(false)}
        >
          {/* Close button */}
          <Dialog.Close
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            onClick={e => e.stopPropagation()}
          >
            <X size={18} className="text-white" />
          </Dialog.Close>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-semibold px-3 py-1.5 rounded-full z-10">
              {idx + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <img
            src={images[idx]}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl select-none"
            style={{ maxHeight: 'calc(100vh - 80px)' }}
            onClick={e => e.stopPropagation()}
          />

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={22} className="text-white" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
              >
                <ChevronRight size={22} className="text-white" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setIdx(i) }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === idx ? 'bg-white w-4' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Convenience component for a grid of photos
export function PhotoGrid({ photos, className = '' }: { photos: string[]; className?: string }) {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)

  if (!photos.length) return null

  return (
    <>
      <div className={`flex gap-2 flex-wrap ${className}`}>
        {photos.map((src, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); setOpen(true) }}
            className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 active:scale-95 transition-transform"
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 z-[100]" />
          <Dialog.Content
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 focus:outline-none"
            onClick={() => setOpen(false)}
          >
            <Dialog.Close className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10" onClick={e => e.stopPropagation()}>
              <X size={18} className="text-white" />
            </Dialog.Close>

            {photos.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {idx + 1} / {photos.length}
              </div>
            )}

            <img
              src={photos[idx]}
              alt=""
              className="max-w-full max-h-full object-contain rounded-xl select-none"
              style={{ maxHeight: 'calc(100vh - 80px)' }}
              onClick={e => e.stopPropagation()}
            />

            {photos.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length) }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
                  <ChevronLeft size={22} className="text-white" />
                </button>
                <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length) }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
                  <ChevronRight size={22} className="text-white" />
                </button>
              </>
            )}

            {photos.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setIdx(i) }}
                    className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`} />
                ))}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
