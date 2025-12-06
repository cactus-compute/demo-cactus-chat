import { Directory, File, Paths } from 'expo-file-system';

const IMAGES_DIR = new Directory(Paths.document, 'cactus', 'chat-images');

// Ensure the images directory exists
export async function ensureImagesDirExists(): Promise<void> {
  if (!IMAGES_DIR.exists) {
    IMAGES_DIR.create({ intermediates: true });
  }
}

// Copy an image to the documents folder and return the new path
export async function saveImageToDocuments(sourceUri: string): Promise<string> {
  await ensureImagesDirExists();

  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const sourceFile = new File(sourceUri);
  const destFile = new File(IMAGES_DIR, filename);

  sourceFile.copy(destFile);

  return destFile.uri;
}

// Delete an image from the documents folder
export async function deleteImageFromDocuments(imagePath: string): Promise<void> {
  try {
    const file = new File(imagePath);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

// Delete all images for a session (when session is deleted)
export async function deleteImagesForSession(imageUris: string[]): Promise<void> {
  await Promise.all(
    imageUris.map((uri) => {
      if (uri.startsWith(IMAGES_DIR.uri)) {
        return deleteImageFromDocuments(uri);
      }
      return Promise.resolve();
    })
  );
}
