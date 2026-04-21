'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlayerWithProfile } from '@/lib/types';

interface RoomLobbyProps {
    roomCode: string;
    players: PlayerWithProfile[];
    isTeacher: boolean;
    onStart: () => void;
}

export function RoomLobby({ roomCode, players, isTeacher, onStart }: RoomLobbyProps) {
    return (
        <div className="max-w-md mx-auto py-12">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>🏟️ Room Lobby</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm text-white/40 uppercase tracking-[0.3em] font-bold mb-2">Room Code</p>
                        <p className="text-5xl font-[var(--font-display)] font-bold text-sunny font-mono tracking-[0.2em]">
                            {roomCode}
                        </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <p className="text-sm font-semibold text-white/60 mb-3 text-left flex items-center gap-2">
                            <span>👥</span> Waiting for players ({players.length})...
                        </p>
                        <ul className="space-y-2">
                            {players.map((p) => (
                                <li key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 text-white">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                                    <span className="font-medium">{p.profiles?.username}</span>
                                </li>
                            ))}
                            {players.length === 0 && (
                                <li className="text-white/30 italic text-sm py-4">
                                    <span className="text-2xl block mb-1 opacity-50">👤</span>
                                    No one here yet
                                </li>
                            )}
                        </ul>
                    </div>

                    {isTeacher ? (
                        <Button onClick={onStart} fullWidth size="lg" disabled={players.length === 0} className="text-xl py-5">
                            🚀 Start Stage 1
                        </Button>
                    ) : (
                        <div className="py-4 text-white/40 italic flex items-center justify-center gap-2">
                            <span className="text-2xl animate-float-slow">⏳</span>
                            Waiting for teacher to start...
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
