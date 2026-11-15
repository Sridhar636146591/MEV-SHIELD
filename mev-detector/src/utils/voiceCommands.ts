/**
 * Voice Command Interface for MEV Detector
 * Speech recognition and voice control integration
 */

export interface VoiceCommand {
  command: string;
  action: () => Promise<void>;
  aliases: string[];
}

class VoiceCommandInterface {
  private recognition: any;
  private commands: VoiceCommand[] = [];
  private isListening: boolean = false;

  constructor() {
    this.initializeSpeechRecognition();
    this.registerDefaultCommands();
  }

  /**
   * Initialize speech recognition
   */
  private initializeSpeechRecognition(): void {
    // @ts-ignore - Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        this.processVoiceCommand(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    } else {
      console.warn('Web Speech API not supported in this browser');
    }
  }

  /**
   * Register default voice commands
   */
  private registerDefaultCommands(): void {
    this.commands = [
      {
        command: 'check transaction',
        action: async () => {
          console.log('Opening transaction checker...');
          // Implement transaction check logic
        },
        aliases: ['analyze tx', 'check tx', 'scan transaction'],
      },
      {
        command: 'protect my trade',
        action: async () => {
          console.log('Enabling Flashbots protection...');
          // Enable protection
        },
        aliases: ['enable protection', 'activate shield', 'safe mode'],
      },
      {
        command: 'what is my risk score',
        action: async () => {
          console.log('Calculating risk score...');
          // Calculate and announce risk score
        },
        aliases: ['risk level', 'how risky', 'safety check'],
      },
      {
        command: 'show me top attacks',
        action: async () => {
          console.log('Displaying top attacks today...');
          // Show attacks dashboard
        },
        aliases: ['recent attacks', 'attack feed', 'latest mevs'],
      },
      {
        command: 'gas tracker',
        action: async () => {
          console.log('Current gas prices...');
          // Fetch and announce gas prices
        },
        aliases: ['gas prices', 'current gas', 'gwei'],
      },
      {
        command: 'portfolio overview',
        action: async () => {
          console.log('Loading portfolio...');
          // Show portfolio dashboard
        },
        aliases: ['my portfolio', 'holdings', 'balance'],
      },
      {
        command: 'help',
        action: async () => {
          console.log('Available commands: check transaction, protect trade, risk score, etc.');
        },
        aliases: ['commands', 'what can you do', 'voice commands'],
      },
    ];
  }

  /**
   * Process voice command
   */
  private async processVoiceCommand(transcript: string): Promise<void> {
    console.log('Heard:', transcript);

    for (const cmd of this.commands) {
      if (transcript.includes(cmd.command) || 
          cmd.aliases.some(alias => transcript.includes(alias))) {
        console.log('Matched command:', cmd.command);
        await cmd.action();
        this.speak(`Executing ${cmd.command}`);
        return;
      }
    }

    this.speak('Command not recognized. Say "help" for available commands.');
  }

  /**
   * Start listening for voice commands
   */
  public startListening(): void {
    if (!this.recognition) {
      alert('Voice commands are not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.speak('Listening for commands...');
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  }

  /**
   * Stop listening
   */
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Speak text to user
   */
  private speak(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Add custom command
   */
  public addCommand(command: string, action: () => Promise<void>, aliases: string[]): void {
    this.commands.push({ command, action, aliases });
  }

  /**
   * Check if voice commands are supported
   */
  public isSupported(): boolean {
    return !!(
      // @ts-ignore
      window.SpeechRecognition || 
      // @ts-ignore
      window.webkitSpeechRecognition
    );
  }
}

export default new VoiceCommandInterface();
