import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Note, Summary } from '../types';

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Note) => void;
  onCancel: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [editedText, setEditedText] = useState(note?.editedText || note?.originalText || '');
  const [tags, setTags] = useState(note?.tags.join(', ') || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setEditedText(note.editedText || note.originalText || '');
      setTags(note.tags.join(', '));
    }
  }, [note]);

  const handleSave = () => {
    if (!note) {
      Alert.alert('Error', 'No note data available');
      return;
    }

    if (!editedText.trim()) {
      Alert.alert('Error', 'Note content cannot be empty');
      return;
    }

    const updatedNote: Note = {
      ...note,
      title: title.trim() || undefined,
      editedText: editedText.trim(),
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      updatedAt: new Date(),
    };

    onSave(updatedNote);
    setIsEditing(false);
  };

  const renderSummarySection = () => {
    if (!note?.summary) return null;

    const { summary } = note;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>AI Summary</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryType}>Type: {summary.type.toUpperCase()}</Text>
          <Text style={styles.summaryText}>{summary.summary}</Text>
          
          {summary.journalPrompt && (
            <View style={styles.promptContainer}>
              <Text style={styles.promptTitle}>Journal Prompt:</Text>
              <Text style={styles.promptText}>{summary.journalPrompt}</Text>
            </View>
          )}
          
          {summary.taskList && summary.taskList.length > 0 && (
            <View style={styles.taskContainer}>
              <Text style={styles.taskTitle}>Task List:</Text>
              {summary.taskList.map((task, index) => (
                <Text key={index} style={styles.taskItem}>• {task}</Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!note) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No note data available</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Note Editor</Text>
        <Text style={styles.dateText}>
          Created: {note.createdAt.toLocaleDateString()}
        </Text>
      </View>

      {/* Title Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Title (Optional)</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter a title for your note..."
          editable={isEditing}
        />
      </View>

      {/* Original Text Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Original Transcription</Text>
        <View style={styles.originalTextContainer}>
          <Text style={styles.originalText}>{note.originalText}</Text>
          <Text style={styles.confidenceText}>
            Confidence: {((note.transcription.confidence || 0) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Edited Text Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Edited Text</Text>
        <TextInput
          style={styles.textArea}
          value={editedText}
          onChangeText={setEditedText}
          placeholder="Edit your transcribed text..."
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          editable={isEditing}
        />
      </View>

      {/* Tags Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="Enter tags separated by commas..."
          editable={isEditing}
        />
      </View>

      {/* Summary Section */}
      {renderSummarySection()}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {!isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Note</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  originalTextContainer: {
    backgroundColor: '#ecf0f1',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  originalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
  },
  confidenceText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
    fontStyle: 'italic',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#f8f9fa',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  summaryType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#27ae60',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
    marginBottom: 16,
  },
  promptContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e44ad',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2c3e50',
    fontStyle: 'italic',
  },
  taskContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e67e22',
    marginBottom: 8,
  },
  taskItem: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2c3e50',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 24,
  },
});