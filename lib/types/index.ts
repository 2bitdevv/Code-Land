export type Role = 'student' | 'teacher';

export interface Profile {
    id: string;
    username: string;
    role: Role;
    created_at: string;
}

export type Medal = 'gold' | 'silver' | 'bronze';

export interface GlobalScore {
    id: string;
    user_id: string;
    stage_id: number;
    score?: number;
    time: number;
    medal: Medal;
    created_at: string;
}

export type RoomStatus = 'waiting' | 'playing' | 'ended';

export interface Room {
    id: string;
    room_code: string;
    teacher_id: string;
    status: RoomStatus;
    categories: string[];
    created_at: string;
}

export interface RoomPlayer {
    id: string;
    room_id: string;
    student_id: string;
}

export interface RoomScore {
    id: string;
    room_id: string;
    student_id: string;
    stage_id: number;
    score: number;
    time: number;
    created_at: string;
}

export interface ScoreWithProfile extends Partial<RoomScore>, Partial<GlobalScore> {
    profiles: { username: string } | null;
}

export interface PlayerWithProfile extends RoomPlayer {
    profiles: { username: string } | null;
}
