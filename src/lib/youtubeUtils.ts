import { YoutubeTranscript } from 'youtube-transcript';

export async function fetchYoutubeTranscript(url: string): Promise<{ transcript: string, videoId: string }> {
  const match = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = match ? match[1] : null;
  if (!videoId) throw new Error('Invalid YouTube URL');

  const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
  const transcript = transcriptArray.map(item => item.text).join(' ');
  return { transcript, videoId };
}