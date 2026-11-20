// Mirror — shared types

export type SessionContext =
  | "My Work"
  | "A Decision"
  | "My Skills"
  | "My Beliefs"
  | "Something Else";

export type MessageRole = "mirror" | "user" | "system";

export interface MirrorMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface MirrorSessionStats {
  questionCount: number;   // mirror messages
  userCount: number;       // user messages
}

export interface MirrorUserData {
  userId: string;
  pastSessions: MirrorPastSession[];
}

export interface MirrorPastSession {
  id: string;
  created_at: string;
  topics: string[];
  ai_question_count: number;
  user_message_count: number;
  dependency_flags: number;
  session_duration_seconds: number;
}

// Opening questions keyed by context
export const OPENING_QUESTIONS: Record<SessionContext, string | null> = {
  "My Work":
    "What aspect of your work has been taking up the most mental space lately — and why do you think that is?",
  "A Decision":
    "What decision are you sitting with — and what would it mean to get it wrong?",
  "My Skills":
    "Which skill of yours feels most at risk of being replaced or forgotten — and what would losing it actually cost you?",
  "My Beliefs":
    "What do you believe right now that you wouldn't have believed five years ago — and what changed?",
  "Something Else": null, // generated via API or fallback
};

export const OPENING_FALLBACK =
  "What would you like to think through today?";

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
