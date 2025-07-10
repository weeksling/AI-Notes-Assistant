import { Summary, SummaryResult } from '../types';

export class LLMSummarizer {
  private static instance: LLMSummarizer;

  static getInstance(): LLMSummarizer {
    if (!LLMSummarizer.instance) {
      LLMSummarizer.instance = new LLMSummarizer();
    }
    return LLMSummarizer.instance;
  }

  async generateSummary(text: string, type: 'journal' | 'tasks' | 'general' = 'general'): Promise<SummaryResult> {
    try {
      console.log('Generating summary for text:', text.substring(0, 100) + '...');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      const summary = await this.createMockSummary(text, type);

      return {
        success: true,
        summary,
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        success: false,
        error: 'Failed to generate summary. Please try again.',
      };
    }
  }

  private async createMockSummary(originalText: string, type: 'journal' | 'tasks' | 'general'): Promise<Summary> {
    const id = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let summary: string;
    let journalPrompt: string | undefined;
    let taskList: string[] | undefined;

    // Generate different types of summaries based on the content
    if (this.containsTaskKeywords(originalText) || type === 'tasks') {
      summary = this.generateTaskSummary(originalText);
      taskList = this.extractTasks(originalText);
      type = 'tasks';
    } else if (this.containsPersonalReflection(originalText) || type === 'journal') {
      summary = this.generateJournalSummary(originalText);
      journalPrompt = this.generateJournalPrompt(originalText);
      type = 'journal';
    } else {
      summary = this.generateGeneralSummary(originalText);
      type = 'general';
    }

    return {
      id,
      originalText,
      summary,
      journalPrompt,
      taskList,
      type,
      createdAt: new Date(),
    };
  }

  private containsTaskKeywords(text: string): boolean {
    const taskKeywords = ['need to', 'should', 'reminder', 'todo', 'task', 'deadline', 'schedule', 'appointment', 'meeting', 'call', 'buy', 'pay', 'follow up'];
    const lowerText = text.toLowerCase();
    return taskKeywords.some(keyword => lowerText.includes(keyword));
  }

  private containsPersonalReflection(text: string): boolean {
    const reflectionKeywords = ['feeling', 'grateful', 'think', 'believe', 'reflection', 'personal', 'emotion', 'mood', 'experience', 'learned'];
    const lowerText = text.toLowerCase();
    return reflectionKeywords.some(keyword => lowerText.includes(keyword));
  }

  private generateTaskSummary(text: string): string {
    const taskSummaries = [
      "Action items identified from your note with specific tasks and deadlines.",
      "Task list extracted with priorities and follow-up actions required.",
      "Actionable items organized by urgency and importance from your recording.",
      "Work-related tasks and personal reminders compiled from your note.",
    ];
    return taskSummaries[Math.floor(Math.random() * taskSummaries.length)];
  }

  private generateJournalSummary(text: string): string {
    const journalSummaries = [
      "Personal reflection capturing your thoughts and feelings about recent experiences.",
      "Emotional insights and self-awareness moments from your voice note.",
      "Mindful observations about your personal growth and life experiences.",
      "Thoughtful reflection on your current state of mind and aspirations.",
    ];
    return journalSummaries[Math.floor(Math.random() * journalSummaries.length)];
  }

  private generateGeneralSummary(text: string): string {
    const generalSummaries = [
      "Key points and main ideas extracted from your voice recording.",
      "Summary of important information and notable details from your note.",
      "Condensed overview highlighting the essential content of your recording.",
      "Brief synopsis capturing the main themes and significant points discussed.",
    ];
    return generalSummaries[Math.floor(Math.random() * generalSummaries.length)];
  }

  private extractTasks(text: string): string[] {
    // Mock task extraction based on common patterns
    const tasks: string[] = [];
    
    if (text.toLowerCase().includes('buy')) {
      tasks.push('Purchase items mentioned in the note');
    }
    if (text.toLowerCase().includes('call')) {
      tasks.push('Make phone calls as discussed');
    }
    if (text.toLowerCase().includes('meeting')) {
      tasks.push('Schedule or attend meetings');
    }
    if (text.toLowerCase().includes('follow up')) {
      tasks.push('Follow up on pending items');
    }
    if (text.toLowerCase().includes('deadline')) {
      tasks.push('Complete tasks before deadline');
    }
    if (text.toLowerCase().includes('appointment')) {
      tasks.push('Schedule appointments');
    }

    // Add some generic tasks if none detected
    if (tasks.length === 0) {
      tasks.push('Review and organize information from this note');
      tasks.push('Take action on relevant items discussed');
    }

    return tasks;
  }

  private generateJournalPrompt(text: string): string {
    const prompts = [
      "Reflect on how this experience has shaped your perspective. What insights have you gained?",
      "What emotions came up for you during this situation? How did you handle them?",
      "If you could give advice to someone in a similar situation, what would you tell them?",
      "What are you most grateful for in this moment? How can you carry this feeling forward?",
      "What patterns do you notice in your thoughts and reactions? What would you like to change?",
      "How has this experience contributed to your personal growth? What did you learn about yourself?",
      "What would you like to remember most about this moment in the future?",
      "How can you apply the lessons from this experience to future challenges?",
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  // Method to check if LLM service is available
  isServiceAvailable(): boolean {
    // TODO: Implement actual service availability check
    return true;
  }
}

// Integration notes for future LLM implementation:
//
// For cloud-based LLM services:
// 1. OpenAI GPT API (ChatGPT, GPT-4)
// 2. Anthropic Claude API
// 3. Google Bard/Gemini API
// 4. AWS Bedrock
// 5. Azure OpenAI Service
//
// For on-device LLM (future consideration):
// 1. Transformers.js for lightweight models
// 2. Core ML models on iOS
// 3. TensorFlow Lite on Android
//
// Example API integration:
// ```typescript
// async callOpenAI(prompt: string): Promise<string> {
//   const response = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       model: 'gpt-3.5-turbo',
//       messages: [{ role: 'user', content: prompt }],
//       max_tokens: 500,
//     }),
//   });
//   const data = await response.json();
//   return data.choices[0].message.content;
// }
// ```