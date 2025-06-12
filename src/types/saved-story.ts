import { CarDetails } from './car-details';
import { StoryResponse } from './story-response';

export interface SavedStory {
  id: string;
  title: string;
  carDetails: CarDetails;
  storyParts: StoryResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedStoryMeta {
  id: string;
  title: string;
  carMake: string;
  carModel: string;
  carYear: string;
  createdAt: Date;
  updatedAt: Date;
}