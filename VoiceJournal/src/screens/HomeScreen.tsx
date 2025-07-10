import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { NoteCard } from '../components/NoteCard';
import { StorageManager } from '../services/StorageManager';
import { Note } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageManager = StorageManager.getInstance();

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    // Filter notes based on search query
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const filtered = notes.filter(note =>
        note.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.editedText && note.editedText.toLowerCase().includes(searchQuery.toLowerCase())) ||
        note.summary.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredNotes(filtered);
    }
  }, [searchQuery, notes]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const loadedNotes = await storageManager.getAllNotes();
      // Sort notes by creation date (newest first)
      const sortedNotes = loadedNotes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotes(sortedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageManager.deleteNote(noteId);
              await loadNotes(); // Reload notes after deletion
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const handleNotePress = (note: Note) => {
    navigation.navigate('NoteEditor', { noteId: note.id });
  };

  const renderNoteCard = ({ item }: { item: Note }) => (
    <NoteCard
      note={item}
      onPress={() => handleNotePress(item)}
      onDelete={() => handleDeleteNote(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎙️</Text>
      <Text style={styles.emptyTitle}>No Notes Yet</Text>
      <Text style={styles.emptyText}>
        Start by recording your first voice note or selecting an audio file to transcribe.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Record')}
      >
        <Text style={styles.emptyButtonText}>Create First Note</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your notes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Journal</Text>
        <Text style={styles.subtitle}>
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </Text>
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => navigation.navigate('ErrorReport')}
        >
          <Text style={styles.debugButtonText}>🔧 Debug</Text>
        </TouchableOpacity>
      </View>

      {notes.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Record')}
        >
          <Text style={styles.primaryButtonText}>🎙️ New Recording</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotes}
        renderItem={renderNoteCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  primaryButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#7f8c8d',
  },
  debugButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#95a5a6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});