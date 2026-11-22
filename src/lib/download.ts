/**
 * Fetch a (possibly cross-origin) file and trigger a real browser download.
 * The HTML `download` attribute is ignored for cross-origin URLs such as
 * Blossom mirrors, so a Blob URL is required.
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Give mobile browsers time to start the download before releasing the URL.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
