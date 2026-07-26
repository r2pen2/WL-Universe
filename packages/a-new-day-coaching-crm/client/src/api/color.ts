export function shouldUseBlackText(hexColor: string) {
  // Convert the hex color to RGB
  const r = parseInt(hexColor.substring(1, 3), 16) / 255;
  const g = parseInt(hexColor.substring(3, 5), 16) / 255;
  const b = parseInt(hexColor.substring(5, 7), 16) / 255;

  // Calculate the luminance
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Define the luminance threshold for choosing black text
  // Common practice is to use a threshold of around 0.8 to 0.9 for white or very light backgrounds
  const threshold = 0.8;

  // Return true if the luminance is greater than the threshold (light background)
  return luminance > threshold;
}


export const viewButtonColor    = "light-dark(var(--mantine-color-cyan-7),    var(--mantine-color-cyan-5))"
export const deleteButtonColor  = "light-dark(var(--mantine-color-red-7),     var(--mantine-color-red-5))"
export const acceptButtonColor  = "light-dark(var(--mantine-color-green-8),   var(--mantine-color-green-5))"
export const assignButtonColor  = "light-dark(var(--mantine-color-green-8),   var(--mantine-color-green-5))"
export const unpaidColor        = "light-dark(var(--mantine-color-orange-6),  var(--mantine-color-orange-5))"