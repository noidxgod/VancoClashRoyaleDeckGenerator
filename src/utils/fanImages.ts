import { slugifyModel } from './strings'

export const buildStrictFanImagePath = (modelName: string): string => {
  const slug = slugifyModel(modelName)
  return `/fans/${slug}.png`
}

export const buildStrictFanImageFileName = (modelName: string): string => {
  const slug = slugifyModel(modelName)
  return `${slug}.png`
}
