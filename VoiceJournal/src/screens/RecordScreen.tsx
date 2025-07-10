import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AudioRecorder } from '../components/AudioRecorder';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TranscriptionHandler } from '../services/TranscriptionHandler';
import { LLMSummarizer } from '../services/LLMSummarizer';
import { StorageManager } from '../services/StorageManager';
import { AudioRecording, Note, Transcription, Summary } from '../types';

interface RecordScreenProps {
  navigation: any;
}

type ProcessingStep = 'idle' | 'transcribing' | 'summarizing' | 'saving' | 'complete';

export const RecordScreen: React.FC<RecordScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('idle');
  const [audioRecording, setAudioRecording] = useState<AudioRecording | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcriptionHandler = TranscriptionHandler.getInstance();
  const llmSummarizer = LLMSummarizer.getInstance();
  const storageManager = StorageManager.getInstance();

  const processAudioRecording = async (recording: AudioRecording) => {
    setAudioRecording(recording);
    setError(null);
    await processAudioFile(recording.uri);
  };

  const processAudioFile = async (audioUri: string) => {
    try {
      // Step 1: Transcribe audio
      setCurrentStep('transcribing');
      const transcriptionResult = await transcriptionHandler.transcribeAudio(audioUri);
      
      if (!transcriptionResult.success || !transcriptionResult.text) {
        throw new Error(transcriptionResult.error || 'Transcription failed');
      }

      const newTranscription: Transcription = {
        id: `transcription_${Date.now()}`,
        text: transcriptionResult.text,
        confidence: transcriptionResult.confidence,
        createdAt: new Date(),
      };
      setTranscription(newTranscription);

      // Step 2: Generate summary
      setCurrentStep('summarizing');
      const summaryResult = await llmSummarizer.generateSummary(transcriptionResult.text);
      
      if (!summaryResult.success || !summaryResult.summary) {
        throw new Error(summaryResult.error || 'Summary generation failed');
      }

      setSummary(summaryResult.summary);

      // Step 3: Save note
      setCurrentStep('saving');
             const note: Note = {
         id: `note_${Date.now()}`,
         originalText: transcriptionResult.text,
         summary: summaryResult.summary,
         audioRecording: audioRecording || undefined,
         transcription: newTranscription,
         tags: [],
         createdAt: new Date(),
         updatedAt: new Date(),
       };

      await storageManager.saveNote(note);
      setCurrentStep('complete');

      // Navigate to editor after a brief delay
      setTimeout(() => {
        navigation.replace('NoteEditor', { noteId: note.id });
      }, 1500);

    } catch (error) {
      console.error('Error processing audio:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setCurrentStep('idle');
    }
  };

  const resetSession = () => {
    setCurrentStep('idle');
    setAudioRecording(null);
    setTranscription(null);
    setSummary(null);
    setError(null);
  };

  const getStepMessage = (step: ProcessingStep): string => {
    switch (step) {
      case 'transcribing':
        return 'Converting speech to text...';
      case 'summarizing':
        return 'Generating AI summary and insights...';
      case 'saving':
        return 'Saving your note...';
      case 'complete':
        return 'Note created successfully!';
      default:
        return '';
    }
  };

  const getStepIcon = (step: ProcessingStep): string => {
    switch (step) {
      case 'transcribing':
        return '🎧';
      case 'summarizing':
        return '🧠';
      case 'saving':
        return '💾';
      case 'complete':
        return '✅';
      default:
        return '';
    }
  };

  const renderProcessingStatus = () => {
    if (currentStep === 'idle') return null;

    return (
      <View style={styles.processingContainer}>
        <Text style={styles.processingIcon}>
          {getStepIcon(currentStep)}
        </Text>
        <LoadingSpinner 
          message={getStepMessage(currentStep)}
          size="large"
        />
        
        {currentStep === 'complete' && (
          <View style={styles.completeContainer}>
            <Text style={styles.completeText}>
              Your note has been processed and saved successfully!
            </Text>
            <Text style={styles.redirectText}>
              Redirecting to editor...
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Processing Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={resetSession}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isProcessing = currentStep !== 'idle';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>New Voice Note</Text>
        <Text style={styles.subtitle}>
          Record audio or select a file to create a new note
        </Text>
      </View>

      {!isProcessing && !error && (
        <AudioRecorder
          onRecordingComplete={processAudioRecording}
          onFileSelected={processAudioFile}
        />
      )}

      {renderProcessingStatus()}
      {renderError()}

      {!isProcessing && !error && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              Record your voice or select an audio file
            </Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              AI transcribes your speech to text
            </Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>
              AI generates summaries and insights
            </Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>
              Edit and organize your note with tags
            </Text>
          </View>
        </View>
      )}

      {!isProcessing && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  processingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  processingIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  completeContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  completeText: {
    fontSize: 16,
    color: '#27ae60',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  redirectText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 20,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#3498db',
    color: '#fff',
    textAlign: 'center',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 16,
  },
  backButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});