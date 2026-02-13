/**
 * API Type Definitions
 * Matches backend Pydantic models
 */

// ============= Event Models =============
export interface EventCreate {
  title: string;
  description?: string;
  event_date?: string; // ISO date string
  feedback_open_at?: string; // ISO datetime string
  feedback_close_at?: string; // ISO datetime string
}

export interface EventRead {
  id: string;
  speaker_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  public_token: string;
  is_active: boolean;
  feedback_open_at: string | null;
  feedback_close_at: string | null;
  created_at: string;
}

export interface EventQRResponse {
  event_id: string;
  feedback_url: string;
  qr_base64: string;
}

// ============= Feedback Models =============
export interface FeedbackTextCreate {
  text: string;
}

export interface FeedbackResponse {
  id: string;
  sentiment: string;
  confidence: number;
  decision: string;
}

export interface EventFeedbackRead {
  id: string;
  event_id: string;
  input_type: string;
  raw_text: string;
  normalized_text: string | null;
  audio_path: string | null;
  sentiment: string | null;
  confidence: number | null;
  quality_decision: string | null;
  quality_flags: string | null;
  created_at: string;
}

// ============= Analytics Models =============
export interface SentimentCount {
  count: number;
  percentage: number;
}

export interface SentimentDistribution {
  positive: SentimentCount;
  negative: SentimentCount;
  neutral: SentimentCount;
}

export interface QualityBreakdown {
  accepted: number;
  flagged: number;
  rejected: number;
}

export interface InputTypeBreakdown {
  text: number;
  audio: number;
}

export interface FeedbackCollectionPeriod {
  start_date: string;
  end_date: string | null;
}

export interface EventStats {
  event_id: string;
  event_title: string;
  event_date: string | null;
  total_feedback: number;
  valid_feedback: number;
  sentiment_distribution: SentimentDistribution;
  quality_breakdown: QualityBreakdown;
  input_type_breakdown: InputTypeBreakdown;
  avg_confidence: number;
  feedback_collection_period: FeedbackCollectionPeriod;
}

export interface FeedbackByEvent {
  event_id: string;
  event_title: string;
  feedback_count: number;
}

export interface DashboardStats {
  total_events: number;
  active_events: number;
  total_feedback_count: number;
  overall_sentiment: SentimentDistribution;
  avg_confidence: number;
  feedback_by_event: FeedbackByEvent[];
}

export interface TrendDataPoint {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
}

export interface SentimentTrends {
  event_id: string;
  total_feedback: number;
  trends: TrendDataPoint[];
}

export interface Keyword {
  word: string;
  count: number;
  percentage: number;
}

export interface TopKeywords {
  event_id: string;
  sentiment_filter: string;
  total_keywords_extracted: number;
  keywords: Keyword[];
}

export interface QualityFlag {
  flag: string;
  count: number;
}

export interface QualityMetrics {
  event_id: string;
  total_feedback: number;
  quality_decision_breakdown: QualityBreakdown;
  common_flags: QualityFlag[];
}

// ============= Authentication Models =============
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Speaker {
  id: string;
  username: string;
  email: string;
  name: string;
  created_at: string;
}

// ============= Public Feedback Models =============
export interface EventInfoResponse {
  event_id: string;
  title: string;
  description: string | null;
}

// ============= Consensus Report Models =============
export interface ConsensusReportSummary {
  main_summary: string;
  conflicting_statement: string | null;
  top_weighted_points: string[];
}

export interface ConsensusReport {
  report_id: string;
  event_id: string;
  event_title: string;
  category: string;
  feedback_count: number;
  generation_time: number;
  generated_at: string;
  summary: ConsensusReportSummary;
  highlights: string[];
  concerns: string[];
  next_steps: string[];
}

export interface ConsensusReportHistory {
  event_id: string;
  total_reports: number;
  reports: {
    report_id: string;
    generated_at: string;
    feedback_count: number;
    generation_time: number | null;
  }[];
}
