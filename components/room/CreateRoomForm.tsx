'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateRoomCode } from '@/lib/utils/roomCode';
import { useAuth } from '@/lib/hooks/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function CreateRoomForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const handleCreateRoom = async () => {
        if (!user) return;
        setLoading(true);
        setError('');

        const roomCode = generateRoomCode();

        const { data: room, error: insertError } = await supabase
            .from('rooms')
            .insert({
                room_code: roomCode,
                teacher_id: user.id,
                status: 'waiting'
            })
            .select()
            .single();

        if (insertError) {
            setError('Could not create room. Please try again.');
            setLoading(false);
            return;
        }

        if (room) {
            router.push(`/game/room/${roomCode}`);
        }
    };

    return (
        <div className="flex flex-col space-y-4">
            <Button
                onClick={handleCreateRoom}
                disabled={loading}
                size="lg"
                fullWidth
                className="text-xl py-5"
            >
                {loading ? '⏳ Creating Room...' : '🏟️ Create New Room'}
            </Button>
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}
        </div>
    );
}
