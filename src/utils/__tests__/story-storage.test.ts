import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StoryStorage, storyStorage } from '../story-storage';
import { SavedStory } from '../../types/saved-story';
import { initialCarDetails } from '../../types/car-details';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  objectStoreNames: {
    contains: vi.fn(() => false),
  },
};

const mockDB = {
  transaction: vi.fn(),
  objectStoreNames: {
    contains: vi.fn(() => false),
  },
  createObjectStore: vi.fn(() => ({
    createIndex: vi.fn(),
  })),
};

const mockTransaction = {
  objectStore: vi.fn(),
};

const mockStore = {
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  index: vi.fn(),
  createIndex: vi.fn(),
};

const mockRequest = {
  result: null,
  onerror: null,
  onsuccess: null,
  onupgradeneeded: null,
};

describe('StoryStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('indexedDB', mockIndexedDB);
    vi.stubGlobal('IDBOpenDBRequest', class {});
    vi.stubGlobal('IDBRequest', class {});
    
    // Reset mocks
    mockIndexedDB.open.mockReturnValue(mockRequest);
    mockDB.transaction.mockReturnValue(mockTransaction);
    mockTransaction.objectStore.mockReturnValue(mockStore);
    mockStore.index.mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize database successfully', async () => {
      const initPromise = storyStorage.init();
      
      // Simulate successful DB open
      mockRequest.result = mockDB;
      mockRequest.onsuccess?.();
      
      await expect(initPromise).resolves.toBeUndefined();
    });

    it('should handle initialization error', async () => {
      const initPromise = storyStorage.init();
      
      // Simulate DB open error
      mockRequest.onerror?.();
      
      await expect(initPromise).rejects.toThrow('Failed to open IndexedDB');
    });

    it('should handle server environment', async () => {
      vi.stubGlobal('window', undefined);
      
      await expect(storyStorage.init()).rejects.toThrow('IndexedDB not available in server environment');
    });
  });

  describe('saveStory', () => {
    const mockStory: SavedStory = {
      id: 'test-id',
      title: 'Test Story',
      carDetails: initialCarDetails,
      storyParts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should save story successfully', async () => {
      // Initialize first
      const initPromise = storyStorage.init();
      mockRequest.result = mockDB;
      mockRequest.onsuccess?.();
      await initPromise;

      const putRequest = { onerror: null, onsuccess: null };
      mockStore.put.mockReturnValue(putRequest);
      
      const savePromise = storyStorage.saveStory(mockStory);
      putRequest.onsuccess?.();
      
      await expect(savePromise).resolves.toBeUndefined();
      expect(mockStore.put).toHaveBeenCalledWith(mockStory);
    });

    it('should handle save error', async () => {
      // Initialize first
      const initPromise = storyStorage.init();
      mockRequest.result = mockDB;
      mockRequest.onsuccess?.();
      await initPromise;

      const putRequest = { onerror: null, onsuccess: null };
      mockStore.put.mockReturnValue(putRequest);
      
      const savePromise = storyStorage.saveStory(mockStory);
      putRequest.onerror?.();
      
      await expect(savePromise).rejects.toThrow('Failed to save story');
    });
  });

  describe('getStory', () => {
    it('should get story successfully', async () => {
      // Initialize first
      const initPromise = storyStorage.init();
      mockRequest.result = mockDB;
      mockRequest.onsuccess?.();
      await initPromise;

      const mockStory: SavedStory = {
        id: 'test-id',
        title: 'Test Story',
        carDetails: initialCarDetails,
        storyParts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const getRequest = { onerror: null, onsuccess: null, result: mockStory };
      mockStore.get.mockReturnValue(getRequest);
      
      const getPromise = storyStorage.getStory('test-id');
      getRequest.onsuccess?.();
      
      await expect(getPromise).resolves.toEqual(mockStory);
      expect(mockStore.get).toHaveBeenCalledWith('test-id');
    });

    it('should return null for non-existent story', async () => {
      // Initialize first
      const initPromise = storyStorage.init();
      mockRequest.result = mockDB;
      mockRequest.onsuccess?.();
      await initPromise;

      const getRequest = { onerror: null, onsuccess: null, result: undefined };
      mockStore.get.mockReturnValue(getRequest);
      
      const getPromise = storyStorage.getStory('non-existent');
      getRequest.onsuccess?.();
      
      await expect(getPromise).resolves.toBeNull();
    });
  });

  describe('database not initialized', () => {
    it('should throw error when database not initialized', async () => {
      // Create a fresh storage instance that hasn't been initialized
      const freshStorage = new StoryStorage();
      
      await expect(freshStorage.saveStory({
        id: 'test',
        title: 'test',
        carDetails: initialCarDetails,
        storyParts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })).rejects.toThrow('Database not initialized. Call init() first.');
    });
  });
});