import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportAllStories, importStories, downloadJSON } from '../file-utils';
import { storyStorage } from '../story-storage';
import { SavedStory } from '../../types/saved-story';
import { initialCarDetails } from '../../types/car-details';

// Mock the story storage
vi.mock('../story-storage', () => ({
  storyStorage: {
    init: vi.fn(),
    exportToJSON: vi.fn(),
    importFromJSON: vi.fn(),
  },
}));

// Mock DOM methods
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

describe('File Utils', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    });
    
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    vi.stubGlobal('Blob', class MockBlob {
      constructor(public data: unknown[], public options: unknown) {}
    });

    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockLink);
    mockCreateObjectURL.mockReturnValue('mock-url');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('downloadJSON', () => {
    it('should download stories as JSON file', () => {
      const stories: SavedStory[] = [{
        id: 'test-1',
        title: 'Test Story',
        carDetails: initialCarDetails,
        storyParts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      downloadJSON(stories, 'test.json');

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    });
  });

  describe('exportAllStories', () => {
    it('should export all stories successfully', async () => {
      const mockStories: SavedStory[] = [{
        id: 'test-1',
        title: 'Test Story',
        carDetails: initialCarDetails,
        storyParts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      vi.mocked(storyStorage.init).mockResolvedValue();
      vi.mocked(storyStorage.exportToJSON).mockResolvedValue(mockStories);

      await exportAllStories();

      expect(storyStorage.init).toHaveBeenCalled();
      expect(storyStorage.exportToJSON).toHaveBeenCalled();
    });

    it('should handle empty stories', async () => {
      vi.mocked(storyStorage.init).mockResolvedValue();
      vi.mocked(storyStorage.exportToJSON).mockResolvedValue([]);

      await expect(exportAllStories()).rejects.toThrow('No stories to export');
    });
  });

  describe('importStories', () => {
    it('should handle file upload and import', async () => {
      const mockStories: SavedStory[] = [{
        id: 'test-1',
        title: 'Test Story',
        carDetails: initialCarDetails,
        storyParts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      // Mock file input behavior
      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((event: Event) => void) | null,
        click: vi.fn(),
      };

      const mockFile = new File([JSON.stringify(mockStories)], 'test.json', {
        type: 'application/json',
      });

      mockCreateElement.mockReturnValue(mockInput);
      vi.stubGlobal('FileReader', class MockFileReader {
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
        result = JSON.stringify(mockStories);
        
        readAsText() {
          // Simulate successful read
          setTimeout(() => {
            if (this.onload) {
              this.onload({ target: { result: this.result } } as ProgressEvent<FileReader>);
            }
          }, 0);
        }
      });

      vi.mocked(storyStorage.init).mockResolvedValue();
      vi.mocked(storyStorage.importFromJSON).mockResolvedValue();

      // Start the import process
      const importPromise = importStories();

      // Simulate file selection
      setTimeout(() => {
        if (mockInput.onchange) {
          mockInput.onchange({
            target: { files: [mockFile] }
          } as unknown as Event);
        }
      }, 0);

      const result = await importPromise;

      expect(result).toBe(1);
      expect(storyStorage.init).toHaveBeenCalled();
      expect(storyStorage.importFromJSON).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'test-1',
            title: 'Test Story',
            carDetails: initialCarDetails,
            storyParts: [],
            // Dates will be strings after JSON parsing
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })
        ])
      );
    });
  });
});