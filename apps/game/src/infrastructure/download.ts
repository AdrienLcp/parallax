/** Hands the visitor a text file to save, under `fileName`. */
export const downloadTextFile = ({
  fileName,
  text,
  type
}: {
  fileName: string
  text: string
  type: string
}): void => {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
