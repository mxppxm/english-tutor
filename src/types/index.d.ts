/**
 * 英语学习应用类型定义
 */

// 词汇项
export interface VocabularyItem {
  word: string;
  phonetic?: string;
  meaning: string;
  usage?: string;
  type?: "word" | "phrase";
}

// 语法点
export interface GrammarPoint {
  point: string;
  explanation: string;
  example?: string;
  usage?: string;
}

// 句子分析
export interface SentenceAnalysis {
  original: string;
  translation: string;
  structure?: string;
  breakdown?: string;
  difficulty?: "初级" | "中级" | "高级";
}

// 段落内容
export interface Paragraph {
  id: string;
  original: string;
  translation: string;
  vocabulary?: VocabularyItem[]; // 暂时保留，后续用本地词库
  grammar: GrammarPoint[];
  sentences: SentenceAnalysis[];
}

// 总结信息
export interface Summary {
  mainIdea: string;
  writingStyle: string;
  suggestions: string;
}

// 分析结果
export interface AnalysisResult {
  title: string;
  overview: string;
  difficulty: string;
  paragraphs: Paragraph[];
  summary?: Summary;
  originalText: string;
}

// AI 提供商
export type AIProvider = "doubao" | "gemini";

// 难度级别
export type DifficultyLevel = "入门级" | "初级" | "中级" | "高级";

// 配置信息
export interface ConfigSettings {
  provider: AIProvider;
  doubaoKey: string;
  doubaoModel: string;
  geminiKey: string;
  geminiModel: string;
}

// 错误信息
export interface ErrorInfo {
  message: string;
  type?: "API_KEY" | "RATE_LIMIT" | "NETWORK" | "PARSE" | "UNKNOWN";
}

// 组件Props类型
export interface InputSectionProps {
  inputText: string;
  setInputText: (text: string) => void;
  onAnalyze: () => void;
  onLoadExample: () => void;
  onClear: () => void;
  isLoading: boolean;
}

export interface EnhancedFlatViewProps {
  result: AnalysisResult;
}

export interface ConfigModalProps {
  onClose: () => void;
}

export interface HeaderProps {
  // 无特定props
}

// 工具提示信息
export interface TooltipInfo {
  word?: string;
  phonetic?: string;
  meaning?: string;
  point?: string;
  explanation?: string;
  type: "vocab" | "grammar";
}

// 工具提示位置
export interface TooltipPosition {
  x: number;
  y: number;
}

// 历史记录相关类型
export interface HistoryItem {
  id?: number;
  timestamp: number;
  title: string;
  originalText: string;
  analysisResult: AnalysisResult;
  difficulty: string;
  preview: string;
  wordCount: number;
}

export interface HistoryStats {
  totalCount: number;
  totalWords: number;
  averageWords: number;
  difficultyStats: Record<string, number>;
  monthlyStats: Record<string, number>;
}

export interface HistoryPageResult {
  records: HistoryItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ImportResult {
  successCount: number;
  errorCount: number;
}

export interface DatabaseInfo {
  dbName: string;
  version: number;
  storeName: string;
  recordCount: number;
}

// 历史记录组件Props
export interface HistoryModalProps {
  onClose: () => void;
  onSelectHistory: (result: AnalysisResult) => void;
}
