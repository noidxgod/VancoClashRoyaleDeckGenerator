import { useMemo, useState } from 'react'
import { buildStrictFanImageFileName, buildStrictFanImagePath } from '../utils/fanImages'

interface FanImageProps {
  modelName: string
  alt?: string
  className?: string
  missingClassName?: string
}

export const FanImage = ({
  modelName,
  alt = 'Fan image',
  className = '',
  missingClassName = '',
}: FanImageProps) => {
  const imagePath = useMemo(() => buildStrictFanImagePath(modelName), [modelName])
  const imageFile = useMemo(() => buildStrictFanImageFileName(modelName), [modelName])
  const [failed, setFailed] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 8
  const imageSrc = `${imagePath}?v=${retryToken}`

  const handleError = (): void => {
    setFailed(true)
    if (retryCount < maxRetries) {
      setRetryCount((previous) => previous + 1)
      window.setTimeout(() => {
        setRetryToken((previous) => previous + 1)
      }, 800)
    }
  }

  const handleLoad = (): void => {
    setFailed(false)
  }

  return (
    <div className="relative h-full w-full">
      <img src={imageSrc} alt={alt} className={className} loading="lazy" onError={handleError} onLoad={handleLoad} />

      {failed && retryCount >= maxRetries && (
        <div
          className={`absolute inset-0 grid place-items-center rounded-md border border-rose-600/60 bg-rose-900/20 p-2 text-center ${missingClassName}`}
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-rose-200">Изображение не найдено</p>
            <p className="text-[11px] text-rose-100/90">Нужен файл:</p>
            <p className="text-[11px] text-rose-200">{imageFile}</p>
          </div>
        </div>
      )}
    </div>
  )
}
