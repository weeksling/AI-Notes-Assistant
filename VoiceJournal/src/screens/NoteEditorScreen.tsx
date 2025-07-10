import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { NoteEditor } from '../components/NoteEditor';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StorageManager } from '../services/StorageManager';
import { Note } from '../types';

interface NoteEditorScreenProps {
  route: {
    params: {
      noteId?: string;
    };
  };
  navigation: any;
}

export const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({
  route,
  navigation,
}) => {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageManager = StorageManager.getInstance();
  const { noteId } = route.params || {};

  useEffect(() => {
    loadNote();
  }, [noteId]);

  const loadNote = async () => {
    if (!noteId) {
      setError('No note ID provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const loadedNote = await storageManager.getNoteById(noteId);
      
      if (!loadedNote) {
        setError('Note not found');
      } else {
        setNote(loadedNote);
      }
    } catch (error) {
      console.error('Error loading note:', error);
      setError('Failed to load note');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async (updatedNote: Note) => {
    try {
      await storageManager.saveNote(updatedNote);
      setNote(updatedNote);
      Alert.alert(
        'Success',
        'Note saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Loading note..." />
      </View>
    );
  }

  if (error || !note) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'Note not found'}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NoteEditor
        note={note}
        onSave={handleSaveNote}
        onCancel={handleCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});