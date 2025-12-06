import { File } from 'expo-file-system';

export async function convertPCMToWAV(
  inputFilePath: string,
  outputFilePath: string,
  sampleRate: number = 16000,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Promise<void> {
  // Read raw PCM data as bytes directly
  const inputFile = new File(inputFilePath);
  const pcmBytes = await inputFile.bytes();

  // Calculate WAV parameters
  const dataSize = pcmBytes.length;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  // Create WAV header (44 bytes)
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  // Helper to write strings to buffer
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      header[offset + i] = str.charCodeAt(i);
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // File size - 8
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (PCM)
  view.setUint16(20, 1, true); // AudioFormat = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Combine header + PCM data
  const wavBytes = new Uint8Array(44 + dataSize);
  wavBytes.set(header, 0);
  wavBytes.set(pcmBytes, 44);

  // Write final WAV file
  const outputFile = new File(outputFilePath);
  outputFile.write(wavBytes);
}
