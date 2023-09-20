import openAiSdk from '@tectalic/openai';
import {
  BrainPromptResponse,
  IBrainService,
  IAudioTranscriberBrainService,
  ITextBrainService,
  LocalAudioPrompt,
  TextBrainPrompt,
  IBrainPromptContext,
  BrainSettingsValidationResult,
} from '@hubai/brain-sdk';

/* Example of setting required by this brain */
export interface ISettings {
  apiKey: string; // Required
  textModel?: string;
  audioTranscriberModel?: string;
  audioTranscriberDefaultLanguage?: string;
}

/* If your brain does not support AudioTranscription just remove the interface implementation */
export default class MyBrainService
  implements
    IBrainService,
    ITextBrainService<ISettings>,
    IAudioTranscriberBrainService<ISettings>
{
  async transcribeAudio(
    prompt: LocalAudioPrompt,
    context: IBrainPromptContext<ISettings>,
  ): Promise<BrainPromptResponse> {
    // First we validate the settings
    const validationResult = this.validateSettings(context.settings);

    // If the settings are not valid we return the validation result
    if (!validationResult.success) {
      return Promise.resolve({
        result: validationResult.getMessage(),
        validationResult,
      });
    }

    // We create the params to send to the API
    const params = {
      file: prompt.audioFilePath, // The path to the audio file
      language:
        prompt.language ||
        context.settings.audioTranscriberDefaultLanguage ||
        'en', // The language of the audio file
      model: context.settings.audioTranscriberModel, // The model to use for the transcription
    };

    // We send the request to the API
    const result = await openAiSdk(
      context.settings.apiKey,
    ).audioTranscriptions.create(params);

    // We return the result
    return { result: result.data.text, validationResult };
  }

  sendTextPrompt(
    prompts: TextBrainPrompt[],
    context: IBrainPromptContext<ISettings>,
  ): Promise<BrainPromptResponse> {
    // First we validate the settings
    const validationResult = this.validateSettings(context.settings);

    // If the settings are not valid we return the validation result
    if (!validationResult.success) {
      return Promise.resolve({
        result: validationResult.getMessage(),
        validationResult,
      });
    }

    // We create the params to send to the API
    const params = {
      model: context.settings.textModel,
      messages: prompts.map((m) => ({ role: m.role, content: m.message })),
    };

    return openAiSdk(context.settings.apiKey)
      .chatCompletions.create(params)
      .then((response: any) => ({
        // Return the OpenAI text response in the result field
        result: response.data.choices[0].message.content.trim(),
        validationResult,
      }));
  }

  validateSettings(settings: ISettings): BrainSettingsValidationResult {
    const validation = new BrainSettingsValidationResult();

    if (!settings?.apiKey || settings.apiKey.length < 10) {
      validation.addFieldError('apiKey', 'API key format is invalid');
    }

    return validation;
  }
}
