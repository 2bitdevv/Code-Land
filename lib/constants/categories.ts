import type { ComponentType } from 'react';
import type { StageScorePayload } from '@/lib/utils/score';
import { HTMLStructure_1_1 } from '@/components/game/stages/stage1/1_HTMLStructure';
import HTMLInput_1_2 from '@/components/game/stages/stage1/2_HTMLInput';
import CSSStyling_2_1 from '@/components/game/stages/stage2/1_CSSStyling';
import BoxingQuizBattle_2_2 from '@/components/game/stages/stage2/2_BoxingQuizBattle';
import { JSFunction_3_1 } from '@/components/game/stages/stage3/1_JSFunction';
import { JSLogic_3_2 } from '@/components/game/stages/stage3/2_JSLogic';
import VolleyballGame from '@/components/game/stages/stage4/1_VariablesGame';
import WeightliftingGame from '@/components/game/stages/stage4/2_Weightlifting';


export interface StageComponentProps {
    onComplete?: (payload?: StageScorePayload) => void;
    isActive: boolean;
    /** Room play: skip current stage (teacher flow). */
    onRoomSkip?: () => void;
    /** Room play: leave to dashboard from end screen when supported. */
    onBackToDashboard?: () => void;
}

export interface StageOption {
    id: number;
    title: string;
    sport: string;
    component?: ComponentType<StageComponentProps>;
}

export interface CategoryOption {
    key: string;
    label: string;
    icon: string;
    colorHex: string;
    stages: StageOption[];
}

export const CATEGORIES: CategoryOption[] = [
    {
        key: 'html', label: 'HTML', icon: '🌐', colorHex: '#2196F3',
        stages: [
            { id: 1, title: 'HTML Structure', sport: '🏊', component: HTMLStructure_1_1 },
            { id: 2, title: 'HTML Input', sport: '⚽', component: HTMLInput_1_2 },
        ],
    },
    {
        key: 'css', label: 'CSS', icon: '🎨', colorHex: '#FFD600',
        stages: [
            { id: 3, title: 'CSS Styling', sport: '🏃‍♂️', component: CSSStyling_2_1 },
            { id: 4, title: 'Boxing Quiz', sport: '🥊', component: BoxingQuizBattle_2_2 },
        ],
    },
    {
        key: 'js', label: 'JavaScript', icon: '⚡', colorHex: '#FF7043',
        stages: [
            { id: 5, title: 'JS Function', sport: '🔫', component: JSFunction_3_1 },
            { id: 6, title: 'JS Logic', sport: '🤖', component: JSLogic_3_2 },
        ],
    },
    {
        key: 'python', label: 'Python', icon: '🏐', colorHex: '#42A5F5',
        stages: [
            { id: 101, title: 'Volleyball Game', sport: '🏐', component: VolleyballGame },
            { id: 102, title: 'Weightlifting', sport: '🏋️‍♀️', component: WeightliftingGame },
        ],
    },
];
