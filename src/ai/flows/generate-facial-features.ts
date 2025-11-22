// This is an auto-generated file from Firebase Studio.

'use server';

/**
 * @fileOverview Analyzes a photo to extract facial features for recognition.
 *
 * - generateFacialFeatures - A function that takes a photo and returns a JSON description of facial features.
 * - GenerateFacialFeaturesInput - The input type for the generateFacialFeatures function.
 * - GenerateFacialFeaturesOutput - The return type for the generateFacialFeatures function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';


const GenerateFacialFeaturesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type GenerateFacialFeaturesInput = z.infer<typeof GenerateFacialFeaturesInputSchema>;


const FacialFeaturesSchema = z.object({
    eyes: z.string(),
    nose: z.string(),
    mouth: z.string(),
    faceShape: z.string(),
});
export type FacialFeatures = z.infer<typeof FacialFeaturesSchema>;

const GenerateFacialFeaturesOutputSchema = z.object({
  features: FacialFeaturesSchema,
});
export type GenerateFacialFeaturesOutput = z.infer<typeof GenerateFacialFeaturesOutputSchema>;


export async function generateFacialFeatures(
  input: GenerateFacialFeaturesInput
): Promise<GenerateFacialFeaturesOutput> {
  return generateFacialFeaturesFlow(input);
}


const generateFacialFeaturesFlow = ai.defineFlow(
    {
      name: 'generateFacialFeaturesFlow',
      inputSchema: GenerateFacialFeaturesInputSchema,
      outputSchema: GenerateFacialFeaturesOutputSchema,
    },
    async (input) => {
        const result = await ai.generate({
            model: 'googleai/gemini-1.5-flash-latest',
            prompt: `Describe the facial features of the person in this photo in a detailed JSON format. Include descriptions of eyes, nose, mouth, face shape, and any distinguishing marks.
            
            Photo: {{media url=photoDataUri}}`,
            output: {
                schema: GenerateFacialFeaturesOutputSchema,
            },
            input: { photoDataUri: input.photoDataUri },
        });

        const output = result.output;
        if (!output?.features) {
            throw new Error("Failed to generate facial features from the provided image.");
        }

        return output;
    }
);
