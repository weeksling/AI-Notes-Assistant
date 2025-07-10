import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onDelete?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPress,
  onDelete,
}) => {
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'journal':
        return '#8e44ad';
      case 'tasks':
        return '#e67e22';
      default:
        return '#3498db';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'journal':
        return '📝';
      case 'tasks':
        return '✅';
      default:
        return '📄';
    }
  };

  const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.typeIcon}>
            {getTypeIcon(note.summary.type)}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {note.title || 'Untitled Note'}
          </Text>
          <View style={[
            styles.typeBadge,
            { backgroundColor: getTypeColor(note.summary.type) }
          ]}>
            <Text style={styles.typeText}>
              {note.summary.type.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          {formatDate(note.createdAt)}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.summaryText} numberOfLines={2}>
          {note.summary.summary}
        </Text>
        
        <Text style={styles.originalText} numberOfLines={3}>
          {truncateText(note.editedText || note.originalText)}
        </Text>
      </View>

      {note.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {note.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {note.tags.length > 3 && (
            <Text style={styles.moreTagsText}>
              +{note.tags.length - 3} more
            </Text>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          {note.audioRecording && (
            <Text style={styles.metaText}>
              🎵 {Math.round(note.audioRecording.duration / 1000)}s
            </Text>
          )}
          <Text style={styles.metaText}>
            📊 {((note.transcription.confidence || 0) * 100).toFixed(0)}%
          </Text>
        </View>
        
        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  content: {
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 20,
  },
  originalText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fee',
  },
  deleteText: {
    fontSize: 16,
  },
});