import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@deepgram/sdk@3.4.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mimeType = 'audio/webm' } = await req.json();

    if (!audio) {
      throw new Error('Audio data is required');
    }

    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
    if (!DEEPGRAM_API_KEY) {
      throw new Error('Deepgram API key not configured');
    }

    console.log('Processing STT request for Mr Happy, mimeType:', mimeType);

    // Initialize Deepgram client
    const deepgram = createClient(DEEPGRAM_API_KEY);

    // Convert base64 to binary data
    const binaryString = atob(audio);
    const audioBuffer = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      audioBuffer[i] = binaryString.charCodeAt(i);
    }

    console.log('Audio buffer size:', audioBuffer.length);

    // Create a blob from the audio data
    const audioBlob = new Blob([audioBuffer], { type: mimeType });

    // Transcribe using Deepgram
    const response = await deepgram.listen.prerecorded.transcribeFile(
      audioBlob,
      {
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        punctuate: true,
        diarize: false,
        filler_words: false,
        utterances: true
      }
    );

    const transcript = response.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    
    console.log('Deepgram transcription result:', transcript);

    return new Response(
      JSON.stringify({ 
        text: transcript,
        confidence: response.result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in deepgram-stt function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});