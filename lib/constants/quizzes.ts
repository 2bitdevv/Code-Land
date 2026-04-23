import type { ComponentType } from "react";
import type { StageScorePayload } from "@/lib/utils/score";
import { HTMLCommentSyntax_1_3 } from "@/components/game/quiz/1_HTMLTagBuilderQuiz";
import { HTMLTagAndAttribute_1_4 } from "@/components/game/quiz/2_HTMLFillInTheBlanksQuiz";
import CSSGradientQuiz_2_3 from "@/components/game/quiz/3_CSSGradientQuiz";
import CSSGridLayoutQuiz_2_4 from "@/components/game/quiz/4_CSSGridLayoutQuiz";
import JSLoadingFillQuiz_3_1 from "@/components/game/quiz/5_JSLoadingFillQuiz";

export interface QuizComponentProps {
  onComplete?: (payload?: StageScorePayload) => void;
  isActive: boolean;
  onRoomSkip?: () => void;
  onBackToDashboard?: () => void;
}

export interface QuizOption {
  id: number;
  title: string;
  icon: string;
  category: "HTML" | "CSS" | "JavaScript";
  difficulty: "Basic" | "Medium" | "Hard";
  description: string;
  component: ComponentType<QuizComponentProps>;
}

export const QUIZZES: QuizOption[] = [
  {
    id: 1,
    title: "HTML Tag Builder",
    icon: "🧩",
    category: "HTML",
    difficulty: "Basic",
    description: "Fill missing opening and closing tags.",
    component: HTMLCommentSyntax_1_3,
  },
  {
    id: 2,
    title: "HTML Fill in the Blanks",
    icon: "🧠",
    category: "HTML",
    difficulty: "Basic",
    description: "Complete missing HTML syntax tokens.",
    component: HTMLTagAndAttribute_1_4,
  },
  {
    id: 3,
    title: "CSS Gradient Match",
    icon: "🎨",
    category: "CSS",
    difficulty: "Medium",
    description: "Choose the correct visual result from CSS gradient code.",
    component: CSSGradientQuiz_2_3,
  },
  {
    id: 4,
    title: "CSS Grid Layout Match",
    icon: "🧱",
    category: "CSS",
    difficulty: "Medium",
    description: "Choose the correct grid layout result from CSS code.",
    component: CSSGridLayoutQuiz_2_4,
  },
  {
    id: 5,
    title: "JS Loading Logic Fill",
    icon: "⏳",
    category: "JavaScript",
    difficulty: "Hard",
    description: "Watch loading animation context and fill missing JS code.",
    component: JSLoadingFillQuiz_3_1,
  },
];
