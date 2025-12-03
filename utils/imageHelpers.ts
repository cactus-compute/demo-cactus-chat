import * as FileSystem from 'expo-file-system/legacy';

const IMAGES_DIR = `${FileSystem.documentDirectory}cactus/chat-images/`;

// Ensure the images directory exists
export async function ensureImagesDirExists(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
}

// Copy an image to the documents folder and return the new path
export async function saveImageToDocuments(sourceUri: string): Promise<string> {
  await ensureImagesDirExists();

  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const destPath = `${IMAGES_DIR}${filename}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destPath,
  });

  return destPath;
}

// Delete an image from the documents folder
export async function deleteImageFromDocuments(imagePath: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imagePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(imagePath, { idempotent: true });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

// Delete all images for a session (when session is deleted)
export async function deleteImagesForSession(imageUris: string[]): Promise<void> {
  await Promise.all(
    imageUris.map((uri) => {
      if (uri.startsWith(IMAGES_DIR)) {
        return deleteImageFromDocuments(uri);
      }
      return Promise.resolve();
    })
  );
}
