import type { Video as VideoType } from '../../../services/api/source/Yumme_anime_ru.ts';

export type SourceItem = {
  title: string;
  url: string;
};

export type SettingsPage = 'main' | 'speed' | 'quality';

export type ProgressState = {
  currentTime: number;
  seekableDuration: number;
};

export type VideoPlayerProps = {
  navigateToPanel: (view: 'player' | 'dubber' | 'episode') => void;
  video: VideoType | undefined;
  initialTimeSeconds: number;
  currentTimeSeconds: number;
  onProgressUpdate?: (seconds: number) => void;
};
