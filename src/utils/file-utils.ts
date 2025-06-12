import { SavedStory } from '@/types/saved-story';
import { storyStorage } from './story-storage';

/**
 * Downloads data as a JSON file to the user's device.
 * Creates a temporary download link and triggers the download automatically.
 * 
 * @param data - The story data to export as JSON
 * @param filename - The name for the downloaded file
 */
export function downloadJSON(data: SavedStory[], filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Prompts the user to select and upload a JSON file containing story data.
 * Validates the file format and structure before returning the parsed data.
 * 
 * @returns Promise that resolves to an array of validated story data
 * @throws {Error} When no file is selected
 * @throws {Error} When file format is invalid or cannot be parsed
 * @throws {Error} When story data structure is invalid
 */
export function uploadJSON(): Promise<SavedStory[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // Validate the data structure
          if (!Array.isArray(data)) {
            reject(new Error('Invalid file format: expected an array of stories'));
            return;
          }

          // Basic validation of story structure
          for (const story of data) {
            if (!story.id || !story.title || !story.carDetails || !story.storyParts) {
              reject(new Error('Invalid story format in file'));
              return;
            }
          }

          resolve(data);
        } catch {
          reject(new Error('Failed to parse JSON file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    };

    input.click();
  });
}

/**
 * Exports all saved stories to a JSON file and triggers download.
 * Creates a timestamped filename and handles the complete export process.
 * 
 * @throws {Error} When no stories are available to export
 * @throws {Error} When storage initialization or export fails
 */
export async function exportAllStories(): Promise<void> {
  try {
    await storyStorage.init();
    const stories = await storyStorage.exportToJSON();
    
    if (stories.length === 0) {
      throw new Error('No stories to export');
    }

    const filename = `cartales-stories-${new Date().toISOString().split('T')[0]}.json`;
    downloadJSON(stories, filename);
  } catch (error) {
    throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Imports stories from a user-selected JSON file.
 * Handles file selection, validation, and storage of the imported data.
 * 
 * @returns Promise that resolves to the number of stories successfully imported
 * @throws {Error} When file selection, parsing, or import fails
 */
export async function importStories(): Promise<number> {
  try {
    const stories = await uploadJSON();
    await storyStorage.init();
    await storyStorage.importFromJSON(stories);
    return stories.length;
  } catch (error) {
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}