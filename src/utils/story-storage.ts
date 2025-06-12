import { SavedStory, SavedStoryMeta } from '@/types/saved-story';

const DB_NAME = 'CarTalesDB';
const DB_VERSION = 1;
const STORIES_STORE = 'stories';

/**
 * Manages persistent storage of car stories using IndexedDB.
 * Provides CRUD operations for saving, loading, and managing car stories locally.
 * 
 * @example
 * ```typescript
 * const storage = new StoryStorage();
 * await storage.init();
 * 
 * // Save a story
 * await storage.saveStory(myStory);
 * 
 * // Get all story metadata
 * const stories = await storage.getAllStoryMetas();
 * ```
 */
export class StoryStorage {
  private db: IDBDatabase | null = null;

  /**
   * Initializes the IndexedDB connection and creates the necessary object stores.
   * Must be called before using any other methods.
   * 
   * @throws {Error} When IndexedDB is not available (e.g., in server environment)
   * @throws {Error} When database initialization fails
   */
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

  /**
   * Ensures the database is initialized before performing operations.
   * 
   * @private
   * @returns The initialized database instance
   * @throws {Error} When database is not initialized
   */
  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  /**
   * Saves a car story to IndexedDB storage.
   * If a story with the same ID exists, it will be updated.
   * 
   * @param story - The complete story data to save
   * @throws {Error} When database is not initialized
   * @throws {Error} When save operation fails
   */
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

  /**
   * Retrieves a specific story by its ID.
   * 
   * @param id - The unique identifier of the story to retrieve
   * @returns The complete story data, or null if not found
   * @throws {Error} When database is not initialized
   * @throws {Error} When retrieval operation fails
   */
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

  /**
   * Retrieves metadata for all saved stories.
   * Returns lightweight story information for efficient browsing and listing.
   * Stories are ordered by most recently updated first.
   * 
   * @returns Array of story metadata, sorted by update date (newest first)
   * @throws {Error} When database is not initialized
   * @throws {Error} When retrieval operation fails
   */
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

  /**
   * Permanently deletes a story from storage.
   * 
   * @param id - The unique identifier of the story to delete
   * @throws {Error} When database is not initialized
   * @throws {Error} When deletion operation fails
   */
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

  /**
   * Exports all saved stories as a JSON-serializable array.
   * Used for creating backups of all story data.
   * 
   * @returns Array of all saved stories
   * @throws {Error} When database is not initialized
   * @throws {Error} When export operation fails
   */
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

  /**
   * Imports an array of stories into the database.
   * Stories with existing IDs will be updated; new stories will be added.
   * 
   * @param stories - Array of story data to import
   * @throws {Error} When database is not initialized
   * @throws {Error} When import operation fails for any story
   */
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

/**
 * Singleton instance of StoryStorage for use throughout the application.
 * Ensures consistent access to the same database connection.
 */
export const storyStorage = new StoryStorage();