const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const MAX_PHOTO_EDGE = 1400;

export async function preparePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image or take a new photo.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Choose a photo smaller than 20 MB.");
  }
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } catch {
    throw new Error(
      "Could not open this image. Try a JPG, PNG, or a new camera photo.",
    );
  } finally {
    bitmap?.close();
  }
}
