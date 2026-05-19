const fs = require('fs');

function generateChimeWav() {
  const sampleRate = 22050; // Lower sample rate for super small file size
  const duration = 0.5; // 0.5 seconds total
  const numSamples = sampleRate * duration;
  
  // Create sample buffer (16-bit mono PCM)
  const buffer = Buffer.alloc(numSamples * 2);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Play a beautiful decaying consonant double chime (perfect fifth: 587.33Hz and 880Hz)
    let sampleVal = 0;
    
    // First chime (D5 - 587.33Hz) starts at 0s, decays exponentially
    if (t >= 0) {
      const envelope1 = Math.exp(-6 * t);
      sampleVal += 0.5 * Math.sin(2 * Math.PI * 587.33 * t) * envelope1;
    }
    
    // Second chime (A5 - 880Hz) starts at 0.08s, decays exponentially
    if (t >= 0.08) {
      const t2 = t - 0.08;
      const envelope2 = Math.exp(-6 * t2);
      sampleVal += 0.4 * Math.sin(2 * Math.PI * 880.0 * t2) * envelope2;
    }
    
    // Clip and convert to 16-bit signed integer (-32768 to 32767)
    const intVal = Math.max(-1, Math.min(1, sampleVal)) * 32767;
    buffer.writeInt16LE(intVal, i * 2);
  }
  
  // WAV Header construction
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + buffer.length, 4); // File size - 8
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk 1 size (16 for PCM)
  header.writeUInt16LE(1, 20); // Audio format (1 for PCM)
  header.writeUInt16LE(1, 22); // Mono (1 channel)
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // Byte rate (sampleRate * numChannels * bitsPerSample/8)
  header.writeUInt16LE(2, 32); // Block align (numChannels * bitsPerSample/8)
  header.writeUInt16LE(16, 34); // Bits per sample (16)
  header.write('data', 36);
  header.writeUInt32LE(buffer.length, 40);
  
  const wavFile = Buffer.concat([header, buffer]);
  const base64 = wavFile.toString('base64');
  
  console.log("WAV generated!");
  console.log("Base64 string length:", base64.length);
  
  // Save to file
  fs.writeFileSync('wav_base64.txt', base64);
}

generateChimeWav();
