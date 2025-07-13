import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { AudioRecording, RecordingStatus } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AudioRecorderProps {
  onRecordingComplete: (recording: AudioRecording) => void;
  onFileSelected: (fileUri: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onFileSelected,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [status, setStatus] = useState<RecordingStatus>({
    isRecording: false,
    duration: 0,
  });
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Log errors to AsyncStorage for debugging
  const logError = async (error: any, context: string) => {
    try {
      const errorLog = {
        id: `audio_error_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'audio',
        context,
        message: error?.message || 'Unknown audio error',
        stack: error?.stack || 'No stack trace',
      };

      console.error('AudioRecorder Error:', errorLog);

      // Save to AsyncStorage for user debugging
      const existingLogsJson = await AsyncStorage.getItem('@voice_journal_error_logs');
      const existingLogs = existingLogsJson ? JSON.parse(existingLogsJson) : [];
      const updatedLogs = [errorLog, ...existingLogs].slice(0, 50);
      
      await AsyncStorage.setItem('@voice_journal_error_logs', JSON.stringify(updatedLogs));
    } catch (storageError) {
      console.error('Failed to log audio error:', storageError);
    }
  };

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      setPermissionError(null);

      // Check permissions first with better error handling
      if (!permissionResponse) {
        logError(new Error('Permission response not available'), 'permission_check');
        Alert.alert(
          'Permission Error', 
          'Unable to check microphone permissions. Please restart the app and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (permissionResponse.status !== 'granted') {
        console.log('Requesting microphone permission...');
        const newPermission = await requestPermission();
        
        if (newPermission.status !== 'granted') {
          const errorMsg = `Microphone permission denied: ${newPermission.status}`;
          setPermissionError(errorMsg);
          logError(new Error(errorMsg), 'permission_denied');
          Alert.alert(
            'Microphone Permission Required',
            'Voice Journal needs microphone access to record audio. Please enable microphone permissions in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => {
                // On Android, users need to manually go to settings
                Alert.alert('Settings', 'Please go to Settings > Apps > Voice Journal > Permissions and enable Microphone access.');
              }}
            ]
          );
          return;
        }
      }

      // Try to set audio mode with error handling
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (audioModeError) {
        logError(audioModeError, 'audio_mode_setup');
        console.warn('Audio mode setup failed, continuing anyway:', audioModeError);
        // Continue anyway as some devices may have issues with audio mode
      }

      // Create recording with error handling
      let newRecording;
      try {
        const recordingResult = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        newRecording = recordingResult.recording;
      } catch (createError) {
        logError(createError, 'recording_creation');
        
        // Try with lower quality settings as fallback
        try {
          const fallbackResult = await Audio.Recording.createAsync({
            android: {
              extension: '.m4a',
              outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
              audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
              sampleRate: 22050,
              numberOfChannels: 1,
              bitRate: 64000,
            },
            ios: {
              extension: '.m4a',
              outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
              audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
              sampleRate: 22050,
              numberOfChannels: 1,
              bitRate: 64000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
          });
          newRecording = fallbackResult.recording;
          console.log('Using fallback recording settings');
        } catch (fallbackError) {
          logError(fallbackError, 'fallback_recording_creation');
          throw new Error('Unable to create audio recording. This device may not support audio recording.');
        }
      }
      
      setRecording(newRecording);
      setStatus({ isRecording: true, duration: 0 });

      // Update duration every second with error handling
      const interval = setInterval(async () => {
        try {
          if (newRecording) {
            const recordingStatus = await newRecording.getStatusAsync();
            setStatus(prev => ({
              ...prev,
              duration: recordingStatus.durationMillis || 0,
            }));
          }
        } catch (statusError) {
          console.warn('Error getting recording status:', statusError);
          // Don't crash the app for status check failures
        }
      }, 1000);

      // Clean up interval when recording stops
      newRecording.setOnRecordingStatusUpdate((recordingStatus) => {
        if (!recordingStatus.isRecording) {
          clearInterval(interval);
        }
      });

    } catch (err) {
      console.error('Failed to start recording:', err);
      logError(err, 'start_recording');
      
      Alert.alert(
        'Recording Error', 
        `Failed to start recording: ${err instanceof Error ? err.message : 'Unknown error'}\n\nPlease try again or check if another app is using the microphone.`,
        [{ text: 'OK' }]
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      logError(new Error('Attempted to stop recording but no recording exists'), 'stop_recording_no_recording');
      return;
    }

    try {
      // Stop and unload the recording
      await recording.stopAndUnloadAsync();
      
      // Reset audio mode with error handling
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch (audioModeError) {
        logError(audioModeError, 'audio_mode_reset');
        console.warn('Failed to reset audio mode:', audioModeError);
        // Continue anyway as this is not critical
      }

      const uri = recording.getURI();
      
      if (!uri) {
        logError(new Error('Recording completed but no URI available'), 'no_recording_uri');
        Alert.alert(
          'Recording Error',
          'The recording was completed but the audio file could not be accessed. Please try recording again.',
          [{ text: 'OK' }]
        );
        setRecording(null);
        setStatus({ isRecording: false, duration: 0 });
        return;
      }

      // Get final status with error handling
      let finalStatus;
      try {
        finalStatus = await recording.getStatusAsync();
      } catch (statusError) {
        logError(statusError, 'final_status_check');
        console.warn('Could not get final recording status:', statusError);
        // Use current duration as fallback
        finalStatus = { durationMillis: status.duration };
      }
      
      const audioRecording: AudioRecording = {
        id: `recording_${Date.now()}`,
        uri,
        duration: finalStatus.durationMillis || status.duration || 0,
        createdAt: new Date(),
      };
      
      setStatus({ isRecording: false, duration: 0, uri });
      setRecording(null);
      
      // Call callback with the completed recording
      onRecordingComplete(audioRecording);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      logError(error, 'stop_recording');
      
      // Try to clean up the recording object anyway
      try {
        setRecording(null);
        setStatus({ isRecording: false, duration: 0 });
      } catch (cleanupError) {
        console.error('Failed to cleanup after stop recording error:', cleanupError);
      }
      
      Alert.alert(
        'Stop Recording Error',
        `Failed to properly stop the recording: ${error instanceof Error ? error.message : 'Unknown error'}\n\nThe recording may still be saved. Please try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const selectAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('File selection cancelled by user');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        logError(new Error('No files selected from document picker'), 'file_selection_empty');
        Alert.alert(
          'No File Selected',
          'Please select an audio file to proceed.',
          [{ text: 'OK' }]
        );
        return;
      }

      const asset = result.assets[0];
      
      if (!asset.uri) {
        logError(new Error('Selected file has no URI'), 'file_selection_no_uri');
        Alert.alert(
          'File Error',
          'The selected file could not be accessed. Please try selecting a different file.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Validate file type
      if (asset.mimeType && !asset.mimeType.startsWith('audio/')) {
        logError(new Error(`Invalid file type: ${asset.mimeType}`), 'file_selection_invalid_type');
        Alert.alert(
          'Invalid File Type',
          'Please select an audio file. Supported formats include MP3, M4A, WAV, and other audio files.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('File selected:', { 
        name: asset.name, 
        size: asset.size, 
        type: asset.mimeType,
        uri: asset.uri 
      });

      onFileSelected(asset.uri);

    } catch (error) {
      console.error('Error selecting file:', error);
      logError(error, 'file_selection');
      
      Alert.alert(
        'File Selection Error',
        `Failed to select audio file: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease make sure you have permission to access files and try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Recording</Text>
      
      {permissionError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Permission Error</Text>
          <Text style={styles.errorMessage}>{permissionError}</Text>
        </View>
      )}
      
      {status.isRecording && (
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingText}>Recording...</Text>
          <Text style={styles.duration}>{formatDuration(status.duration)}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!status.isRecording ? (
          <TouchableOpacity
            style={[styles.button, styles.recordButton, permissionError && styles.disabledButton]}
            onPress={startRecording}
            disabled={!!permissionError}
          >
            <Text style={[styles.buttonText, permissionError && styles.disabledButtonText]}>
              Start Recording
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopRecording}
          >
            <Text style={styles.buttonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.fileButton]}
          onPress={selectAudioFile}
          disabled={status.isRecording}
        >
          <Text style={[styles.buttonText, status.isRecording && styles.disabledButtonText]}>
            Select Audio File
          </Text>
        </TouchableOpacity>
      </View>

      {status.uri && !status.isRecording && (
        <Text style={styles.completedText}>
          Recording completed! Duration: {formatDuration(status.duration)}
        </Text>
      )}

      {permissionError && (
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 If you're having issues, try:
          </Text>
          <Text style={styles.helpItem}>• Restart the app</Text>
          <Text style={styles.helpItem}>• Check device settings for microphone permissions</Text>
          <Text style={styles.helpItem}>• Close other apps that might be using the microphone</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  recordingInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingText: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: '600',
  },
  duration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#27ae60',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  fileButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completedText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    marginBottom: 16,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 20,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#7f8c8d',
  },
  helpContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  helpItem: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 8,
    lineHeight: 18,
  },
});