import { SavedStory, SavedStoryMeta } from '@/types/saved-story';

const DB_NAME = 'CarTalesDB';
const DB_VERSION = 1;
const STORIES_STORE = 'stories';

export class StoryStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB not available in server environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORIES_STORE)) {
          const store = db.createObjectStore(STORIES_STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  async saveStory(story: SavedStory): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(STORIES_STORE);
      const request = store.put(story);

      request.onerror = () => {
        reject(new Error('Failed to save story'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async getStory(id: string): Promise<SavedStory | null> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORIES_STORE], 'readonly');
      const store = transaction.objectStore(STORIES_STORE);
      const request = store.get(id);

      request.onerror = () => {
        reject(new Error('Failed to get story'));
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  async getAllStoryMetas(): Promise<SavedStoryMeta[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORIES_STORE], 'readonly');
      const store = transaction.objectStore(STORIES_STORE);
      const index = store.index('updatedAt');
      const request = index.openCursor(null, 'prev'); // Most recent first

      const stories: SavedStoryMeta[] = [];

      request.onerror = () => {
        reject(new Error('Failed to get story list'));
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const story: SavedStory = cursor.value;
          stories.push({
            id: story.id,
            title: story.title,
            carMake: story.carDetails.make,
            carModel: story.carDetails.model,
            carYear: story.carDetails.year,
            createdAt: story.createdAt,
            updatedAt: story.updatedAt,
          });
          cursor.continue();
        } else {
          resolve(stories);
        }
      };
    });
  }

  async deleteStory(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(STORIES_STORE);
      const request = store.delete(id);

      request.onerror = () => {
        reject(new Error('Failed to delete story'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async exportToJSON(): Promise<SavedStory[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORIES_STORE], 'readonly');
      const store = transaction.objectStore(STORIES_STORE);
      const request = store.getAll();

      request.onerror = () => {
        reject(new Error('Failed to export stories'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async importFromJSON(stories: SavedStory[]): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(STORIES_STORE);
      
      let completed = 0;
      const total = stories.length;
      
      if (total === 0) {
        resolve();
        return;
      }

      stories.forEach((story) => {
        const request = store.put(story);
        
        request.onerror = () => {
          reject(new Error(`Failed to import story: ${story.title}`));
        };
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
      });
    });
  }
}

// Create singleton instance
export const storyStorage = new StoryStorage();