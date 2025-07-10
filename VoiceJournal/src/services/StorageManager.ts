import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types';

export class StorageManager {
  private static instance: StorageManager;
  private readonly NOTES_KEY = '@voice_journal_notes';
  private readonly TAGS_KEY = '@voice_journal_tags';

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async saveNote(note: Note): Promise<void> {
    try {
      const existingNotes = await this.getAllNotes();
      const noteIndex = existingNotes.findIndex(n => n.id === note.id);
      
      if (noteIndex >= 0) {
        existingNotes[noteIndex] = note;
      } else {
        existingNotes.push(note);
      }
      
      await AsyncStorage.setItem(this.NOTES_KEY, JSON.stringify(existingNotes));
      await this.updateTags(note.tags);
    } catch (error) {
      console.error('Error saving note:', error);
      throw new Error('Failed to save note');
    }
  }

  async getAllNotes(): Promise<Note[]> {
    try {
      const notesJson = await AsyncStorage.getItem(this.NOTES_KEY);
      if (!notesJson) return [];
      
      const notes = JSON.parse(notesJson);
      return notes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        transcription: {
          ...note.transcription,
          createdAt: new Date(note.transcription.createdAt),
        },
        summary: {
          ...note.summary,
          createdAt: new Date(note.summary.createdAt),
        },
        audioRecording: note.audioRecording ? {
          ...note.audioRecording,
          createdAt: new Date(note.audioRecording.createdAt),
        } : undefined,
      }));
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  async getNoteById(id: string): Promise<Note | null> {
    try {
      const notes = await this.getAllNotes();
      return notes.find(note => note.id === id) || null;
    } catch (error) {
      console.error('Error getting note by id:', error);
      return null;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      const notes = await this.getAllNotes();
      const filteredNotes = notes.filter(note => note.id !== id);
      await AsyncStorage.setItem(this.NOTES_KEY, JSON.stringify(filteredNotes));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }

  async getAllTags(): Promise<string[]> {
    try {
      const tagsJson = await AsyncStorage.getItem(this.TAGS_KEY);
      return tagsJson ? JSON.parse(tagsJson) : [];
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }

  private async updateTags(newTags: string[]): Promise<void> {
    try {
      const existingTags = await this.getAllTags();
      const allTags = [...new Set([...existingTags, ...newTags])];
      await AsyncStorage.setItem(this.TAGS_KEY, JSON.stringify(allTags));
    } catch (error) {
      console.error('Error updating tags:', error);
    }
  }

  async searchNotes(query: string): Promise<Note[]> {
    try {
      const notes = await this.getAllNotes();
      const lowerQuery = query.toLowerCase();
      
      return notes.filter(note => 
        note.originalText.toLowerCase().includes(lowerQuery) ||
        (note.editedText && note.editedText.toLowerCase().includes(lowerQuery)) ||
        note.summary.summary.toLowerCase().includes(lowerQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.NOTES_KEY, this.TAGS_KEY]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
    }
  }
}