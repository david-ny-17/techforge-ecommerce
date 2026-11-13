export const categoryUrl = (slug: string) => `/catalog?category=${slug}`

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"))
  } catch {
    return false
  }
}