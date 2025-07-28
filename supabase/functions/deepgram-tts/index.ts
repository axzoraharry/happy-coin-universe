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
    const { text, voice = 'aura-asteria-en' } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
    if (!DEEPGRAM_API_KEY) {
      throw new Error('Deepgram API key not configured');
    }

    console.log('Generating TTS for Mr Happy:', { text, voice });

    // Initialize Deepgram client
    const deepgram = createClient(DEEPGRAM_API_KEY);

    // Generate speech using Aura TTS
    const response = await deepgram.speak.request(
      { text },
      {
        model: voice,
        encoding: 'linear16',
        sample_rate: 24000,
        container: 'wav'
      }
    );

    const stream = await response.getStream();
    if (!stream) {
      throw new Error('Failed to get audio stream');
    }

    // Convert stream to buffer
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Combine chunks into single buffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const audioBuffer = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    console.log('TTS generated successfully, size:', audioBuffer.length);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error in deepgram-tts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});