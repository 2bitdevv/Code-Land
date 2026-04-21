import { Medal } from '@/lib/types';

/**
 * Calculates a medal based on the time it took to complete a stage.
 * Adjust target times based on the difficulty of the specific stage.
 */
export function calculateMedal(stageId: number, completionTimeInSeconds: number): Medal {
    // Define time thresholds per stage (in seconds)
    // [goldThreshold, silverThreshold]
    const thresholds: Record<number, [number, number]> = {
        1: [15, 30], // HTML Structure
        2: [20, 45], // HTML Input
        3: [25, 50], // CSS Styling
        4: [30, 60], // CSS Flexbox
        5: [45, 90], // JS Function
        6: [60, 120] // JS Logic
    };

    const stageThresholds = thresholds[stageId] || [30, 60];

    if (completionTimeInSeconds <= stageThresholds[0]) {
        return 'gold';
    } else if (completionTimeInSeconds <= stageThresholds[1]) {
        return 'silver';
    } else {
        return 'bronze';
    }
}
