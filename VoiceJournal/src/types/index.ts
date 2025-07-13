export interface AudioRecording {
  id: string;
  uri: string;
  duration: number;
  createdAt: Date;
}

export interface Transcription {
  id: string;
  text: string;
  confidence?: number;
  createdAt: Date;
}

export interface Summary {
  id: string;
  originalText: string;
  journalPrompt?: string;
  taskList?: string[];
  summary: string;
  type: 'journal' | 'tasks' | 'general';
  createdAt: Date;
}

export interface Note {
  id: string;
  title?: string;
  originalText: string;
  editedText?: string;
  summary: Summary;
  audioRecording?: AudioRecording;
  transcription: Transcription;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordingStatus {
  isRecording: boolean;
  duration: number;
  uri?: string;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
  confidence?: number;
}

export interface SummaryResult {
  success: boolean;
  summary?: Summary;
  error?: string;
}

export type NavigationParamList = {
  Home: undefined;
  Record: undefined;
  NoteEditor: { noteId?: string };
  NoteList: undefined;
  NoteDetail: { noteId: string };
  ErrorReport: undefined;
};