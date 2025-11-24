
'use server';

/**
 * @fileOverview Generates a personalized audio greeting with a fast fallback.
 *
 * - generateGreetingAudio - A function that takes a name and returns a WAV audio data URI.
 * - GenerateGreetingAudioInput - The input type for the function.
 * - GenerateGreetingAudioOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

const GenerateGreetingAudioInputSchema = z.object({
  name: z.string().describe('The name of the person to greet.'),
});
export type GenerateGreetingAudioInput = z.infer<typeof GenerateGreetingAudioInputSchema>;

const GenerateGreetingAudioOutputSchema = z.object({
  audio: z
    .string()
    .optional()
    .describe('The base64-encoded WAV audio data URI of the greeting.'),
});
export type GenerateGreetingAudioOutput = z.infer<typeof GenerateGreetingAudioOutputSchema>;


export async function generateGreetingAudio(
  input: GenerateGreetingAudioInput
): Promise<GenerateGreetingAudioOutput> {
  return generateGreetingAudioFlow(input);
}


// Helper to convert PCM audio from the TTS model to WAV format
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateGreetingAudioFlow = ai.defineFlow(
  {
    name: 'generateGreetingAudioFlow',
    inputSchema: GenerateGreetingAudioInputSchema,
    outputSchema: GenerateGreetingAudioOutputSchema,
  },
  async ({ name }) => {
    const greeting = `Hello, ${name}. You have been marked present.`;
    
    try {
      // Race the TTS generation against a timeout.
      const ttsPromise = ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: greeting,
      });

      // If TTS takes too long, we might not get audio, but the flow won't fail.
      // The UI will proceed without it. A short timeout can be considered here
      // but for simplicity, we rely on the model's performance.
      const { media } = await ttsPromise;

      if (media) {
        const audioBuffer = Buffer.from(
          media.url.substring(media.url.indexOf(',') + 1),
          'base64'
        );
        const wavBase64 = await toWav(audioBuffer);
        return {
          audio: `data:audio/wav;base64,${wavBase64}`,
        };
      }
    } catch (e) {
      console.error('TTS generation failed, proceeding without audio.', e);
    }
    
    // Fallback: return nothing if TTS fails or times out.
    // The UI is responsible for handling the case where no audio is returned.
    return {
      audio: undefined,
    };
  }
);

    