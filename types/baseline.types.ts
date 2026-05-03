export type ResponseType = "text" | "audio" | "file" | "multimodal";

export interface BaselineImprint {
  id: string;
  user_id: string;
  cluster: string;
  module_id: string;
  module_name: string;
  prompt_given: string;
  response_text: string | null;
  response_audio_url: string | null;
  response_file_url: string | null;
  response_type: ResponseType;
  word_count: number;
  avg_sentence_length: number;
  vocabulary_richness: number;
  response_time_seconds: number;
  created_at: string;
}

export type BaselineImprintInsert = Omit<BaselineImprint, "id" | "created_at">;

export interface BaselineModule {
  id: string;
  name: string;
  cluster: string;
  prompt: string;
  response_type: ResponseType;
  description: string;
}

export interface BaselineMetrics {
  word_count: number;
  avg_sentence_length: number;
  vocabulary_richness: number;
  response_time_seconds: number;
}

export interface BaselineComparisonResult {
  module_id: string;
  baseline_metrics: BaselineMetrics;
  current_metrics: BaselineMetrics;
  delta_percentage: number;
  divergence_areas: string[];
}
