export type OpenAISettings = {
  apiKey: string; // Required
  textModel?: string;
  audioTranscriberModel?: string;
  audioTranscriberDefaultLanguage?: string;
}
