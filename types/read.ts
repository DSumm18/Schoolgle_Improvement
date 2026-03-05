// Schoolgle Read Module TypeScript Types

export interface ReadingWorld {
  id: string
  name: string
  description: string
  icon: string
  color_gradient: string
  level: string
  difficulty: string
  created_at: string
  updated_at: string
}

export interface Story {
  id: string
  title: string
  content: string
  world_id: string
  author_id: string | null
  difficulty: string
  reading_time_minutes: number
  word_count: number | null
  is_ai_generated: boolean
  is_published: boolean
  is_featured: boolean
  rating: number
  total_reads: number
  created_at: string
  updated_at: string
  // Relations
  world?: ReadingWorld
  author?: {
    id: string
    name: string
    email: string
  }
  images?: StoryImage[]
  quizzes?: Quiz[]
}

export interface StoryImage {
  id: string
  story_id: string
  image_url: string
  alt_text: string | null
  is_primary: boolean
  created_at: string
}

export interface Quiz {
  id: string
  story_id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string | null
  question_type: 'multiple_choice' | 'true_false'
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
}

export interface UserReadingProgress {
  id: string
  user_id: string
  story_id: string
  is_completed: boolean
  reading_time_seconds: number
  comprehension_score: number | null
  last_read_at: string
  completed_at: string | null
  created_at: string
  // Relations
  story?: Story
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  selected_answer: number | null
  is_correct: boolean | null
  time_taken_seconds: number | null
  attempted_at: string
  // Relations
  quiz?: Quiz
}

export interface StoryFeedback {
  id: string
  user_id: string
  story_id: string
  rating: number | null
  comment: string | null
  is_helpful: boolean | null
  created_at: string
  // Relations
  story?: Story
  user?: {
    id: string
    name: string
  }
}

export interface UserReadingStats {
  id: string
  user_id: string
  total_stories_read: number
  total_reading_time_minutes: number
  average_comprehension_score: number
  favorite_world_id: string | null
  current_streak_days: number
  longest_streak_days: number
  last_reading_date: string | null
  created_at: string
  updated_at: string
  // Relations
  favorite_world?: ReadingWorld
}

export interface StoryAssignment {
  id: string
  teacher_id: string
  story_id: string
  class_name: string | null
  assigned_to_user_ids: string[]
  due_date: string | null
  is_active: boolean
  created_at: string
  // Relations
  teacher?: {
    id: string
    name: string
    email: string
  }
  story?: Story
}

// API Request/Response Types

export interface CreateStoryRequest {
  title: string
  world: string
  difficulty: string
  length: string
  characters?: string
  setting?: string
  theme?: string
  customPrompt?: string
}

export interface CreateStoryResponse {
  success: boolean
  story: {
    title: string
    text: string
    world: string
    difficulty: string
    length: string
    characters?: string
    setting?: string
    theme?: string
    generatedAt: string
  }
  quiz: {
    questions: Array<{
      question: string
      options: string[]
      correct: number
      explanation: string
    }>
  }
}

export interface UpdateProgressRequest {
  storyId: string
  isCompleted?: boolean
  readingTimeSeconds?: number
  comprehensionScore?: number
}

export interface SubmitQuizRequest {
  quizId: string
  selectedAnswer: number
  timeTakenSeconds: number
}

export interface SubmitFeedbackRequest {
  storyId: string
  rating?: number
  comment?: string
  isHelpful?: boolean
}

// Component Props Types

export interface WorldPageProps {
  worldId: string
}

export interface StoryReaderProps {
  storyId: string
}

export interface StoryForm {
  title: string
  world: string
  difficulty: string
  length: string
  characters: string
  setting: string
  theme: string
  customPrompt: string
}

// Filter and Search Types

export interface StoryFilters {
  world?: string
  difficulty?: string
  level?: string
  isPublished?: boolean
  isFeatured?: boolean
  minRating?: number
  maxReadingTime?: number
}

export interface SearchParams {
  query?: string
  filters?: StoryFilters
  sortBy?: 'title' | 'rating' | 'created_at' | 'reading_time_minutes'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Dashboard and Analytics Types

export interface ClassReadingStats {
  classId: string
  className: string
  totalStudents: number
  completedStories: number
  avgReadingTime: string
  avgComprehension: number
  favoriteWorld: string
}

export interface StudentProgress {
  id: string
  name: string
  class: string
  storiesRead: number
  avgComprehension: number
  readingTime: string
  favoriteWorld: string
  lastActivity: string
  needsAttention: boolean
}

export interface WorldAnalytics {
  world: string
  icon: string
  totalReads: number
  avgRating: number
  completionRate: number
  difficulty: string
}

// Error Types

export interface ReadModuleError {
  code: string
  message: string
  details?: any
}

// Constants

export const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner (EYFS-KS1)', description: 'Simple vocabulary, short sentences' },
  { value: 'intermediate', label: 'Intermediate (KS1-KS2)', description: 'Moderate vocabulary, varied sentence structure' },
  { value: 'advanced', label: 'Advanced (KS2)', description: 'Complex vocabulary, sophisticated themes' }
] as const

export const STORY_LENGTHS = [
  { value: 'short', label: 'Short (200-400 words)', description: 'Quick read, perfect for younger readers' },
  { value: 'medium', label: 'Medium (400-800 words)', description: 'Standard length, good for most ages' },
  { value: 'long', label: 'Long (800-1200 words)', description: 'Detailed story, ideal for advanced readers' }
] as const

export const READING_WORLDS = [
  { id: 'infinity-guardians', name: 'Infinity Guardians', icon: '🛡️' },
  { id: 'school-adventures', name: 'School Adventures', icon: '🏫' },
  { id: 'magical-creatures', name: 'Magical Creatures Realm', icon: '🦄' },
  { id: 'time-travellers', name: 'Time Traveller\'s Tales', icon: '⏰' },
  { id: 'planet-explorers', name: 'Planet Explorers', icon: '🚀' },
  { id: 'animal-kingdom', name: 'Animal Kingdom', icon: '🐾' },
  { id: 'mystery-detectives', name: 'Mystery & Detectives', icon: '🔍' },
  { id: 'everyday-heroes', name: 'Everyday Heroes', icon: '🌟' },
  { id: 'sports-zone', name: 'Sports Zone', icon: '⚽' }
] as const

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number]['value']
export type StoryLength = typeof STORY_LENGTHS[number]['value']
export type WorldId = typeof READING_WORLDS[number]['id']
