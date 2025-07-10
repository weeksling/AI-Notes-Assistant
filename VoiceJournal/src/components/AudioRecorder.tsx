import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { AudioRecording, RecordingStatus } from '../types';

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

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setStatus({ isRecording: true, duration: 0 });

      // Update duration every second
      const interval = setInterval(async () => {
        if (newRecording) {
          const status = await newRecording.getStatusAsync();
          setStatus(prev => ({
            ...prev,
            duration: status.durationMillis || 0,
          }));
        }
      }, 1000);

      // Clean up interval when recording stops
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording) {
          clearInterval(interval);
        }
      });

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      
      if (uri) {
        const audioRecording: AudioRecording = {
          id: `recording_${Date.now()}`,
          uri,
          duration: status.durationMillis || 0,
          createdAt: new Date(),
        };
        
        setStatus({ isRecording: false, duration: 0, uri });
        onRecordingComplete(audioRecording);
      }

      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const selectAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onFileSelected(asset.uri);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Failed to select audio file. Please try again.');
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
      
      {status.isRecording && (
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingText}>Recording...</Text>
          <Text style={styles.duration}>{formatDuration(status.duration)}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!status.isRecording ? (
          <TouchableOpacity
            style={[styles.button, styles.recordButton]}
            onPress={startRecording}
          >
            <Text style={styles.buttonText}>Start Recording</Text>
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
          <Text style={styles.buttonText}>Select Audio File</Text>
        </TouchableOpacity>
      </View>

      {status.uri && !status.isRecording && (
        <Text style={styles.completedText}>
          Recording completed! Duration: {formatDuration(status.duration)}
        </Text>
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
});