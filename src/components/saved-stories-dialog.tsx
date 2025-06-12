'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SavedStoryMeta } from '@/types/saved-story';
import { storyStorage } from '@/utils/story-storage';
import { formatDistanceToNow } from 'date-fns';

interface SavedStoriesDialogProps {
  onLoadStory: (storyId: string) => void;
  onDeleteStory: (storyId: string) => void;
}

export function SavedStoriesDialog({ onLoadStory, onDeleteStory }: SavedStoriesDialogProps) {
  const [stories, setStories] = useState<SavedStoryMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const loadStories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await storyStorage.init();
      const savedStories = await storyStorage.getAllStoryMetas();
      setStories(savedStories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await storyStorage.deleteStory(storyId);
      onDeleteStory(storyId);
      setStories(stories.filter(s => s.id !== storyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete story');
    }
  };

  const handleLoadStory = (storyId: string) => {
    onLoadStory(storyId);
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      loadStories();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Load Story</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Load Saved Story</DialogTitle>
          <DialogDescription>
            Select a previously saved car story to load.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground">Loading stories...</div>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No saved stories found.
          </div>
        ) : (
          <div className="space-y-2">
            {stories.map((story) => (
              <div
                key={story.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{story.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {story.carYear} {story.carMake} {story.carModel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(story.updatedAt))} ago
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => handleLoadStory(story.id)}
                  >
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteStory(story.id, story.title)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}