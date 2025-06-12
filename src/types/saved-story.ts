import { CarDetails } from './car-details';
import { StoryResponse } from './story-response';

/**
 * Represents a complete saved car story with all its details and content.
 * This is the full data structure stored in IndexedDB for persistent storage.
 */
export interface SavedStory {
  /** Unique identifier for the story */
  id: string;
  /** User-provided title for the story */
  title: string;
  /** Complete car details used to generate the story */
  carDetails: CarDetails;
  /** Array of generated story sections */
  storyParts: StoryResponse[];
  /** Timestamp when the story was first created */
  createdAt: Date;
  /** Timestamp when the story was last updated */
  updatedAt: Date;
}

/**
 * Lightweight metadata representation of a saved story.
 * Used for efficient listing and browsing of saved stories without loading full content.
 */
export interface SavedStoryMeta {
  /** Unique identifier for the story */
  id: string;
  /** User-provided title for the story */
  title: string;
  /** Car manufacturer from the story */
  carMake: string;
  /** Car model from the story */
  carModel: string;
  /** Car manufacturing year from the story */
  carYear: string;
  /** Timestamp when the story was first created */
  createdAt: Date;
  /** Timestamp when the story was last updated */
  updatedAt: Date;
}