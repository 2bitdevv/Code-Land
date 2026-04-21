'use client';

import { useAuth } from '@/lib/hooks/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCallback, useEffect, useState } from 'react';
import { Room } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { generateRoomCode } from '@/lib/utils/roomCode';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabase = createClient();

import { CATEGORIES } from '@/lib/constants/categories';

export default function TeacherPage() {
    const { user, profile, loading } = useAuth();
    const [activeRooms, setActiveRooms] = useState<Room[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    
    useEffect(() => {
        if (createError) console.log("[CreateRoom] error:", createError);
    }, [createError]);

    const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
    const router = useRouter();

    // Frontend role guard — redirect non-teachers
    useEffect(() => {
        if (!loading && (!profile || profile.role !== 'teacher')) {
            router.replace('/dashboard');
        }
    }, [loading, profile, router]);

    // Load active rooms (waiting or playing)
    const loadActiveRooms = useCallback(async () => {
        if (!user) return;
        console.log('[TeacherPage] Loading active rooms for user:', user.id);
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('teacher_id', user.id)
            .in('status', ['waiting', 'playing'])
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('[TeacherPage] Failed to load rooms:', error);
            return;
        }
        console.log('[TeacherPage] Active rooms loaded:', data?.length, data);
        if (data) setActiveRooms(data);
    }, [user]);

    useEffect(() => {
        if (!loading && user) {
            void loadActiveRooms();
        }
    }, [user, loading, loadActiveRooms]);

    // Force refresh active rooms when the page regains focus (e.g., after navigating back from room delete)
    useEffect(() => {
        const handleFocus = () => {
            if (user && !loading) {
                console.log('[TeacherPage] Window focused, refreshing active rooms');
                void loadActiveRooms();
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [user, loading, loadActiveRooms]);

    // Toggle category selection
    const toggleCategory = (key: string) => {
        setSelectedCategories(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleDeleteRoom = async (room: Room) => {
        if (deletingRoomId) return;
        const confirmed = window.confirm(`Delete room ${room.room_code}? All scores and player data will be lost.`);
        if (!confirmed) return;

        setDeletingRoomId(room.id);
        try {
            // Delete child rows first (order matters for FK constraints)
            const { error: e1 } = await supabase.from('room_scores').delete().eq('room_id', room.id);
            if (e1) {
                console.error('Delete room_scores error:', e1);
                throw e1;
            }
            const { error: e2 } = await supabase.from('room_players').delete().eq('room_id', room.id);
            if (e2) {
                console.error('Delete room_players error:', e2);
                throw e2;
            }
            const { error: e3 } = await supabase.from('rooms').delete().eq('id', room.id);
            if (e3) {
                console.error('Delete rooms error:', e3);
                throw e3;
            }

            // Verify the room was actually deleted (RLS can silently block deletes)
            const { data: checkRoom } = await supabase.from('rooms').select('id').eq('id', room.id).maybeSingle();
            if (checkRoom) {
                console.error('Room still exists after delete — likely blocked by RLS policy');
                alert('Could not delete room. Please check Supabase RLS policies for the rooms table.');
                return;
            }
            console.log('[Room] room delete', room.id);

            setActiveRooms(prev => prev.filter(r => r.id !== room.id));
            
            // Re-fetch active rooms from DB
            await loadActiveRooms();
            
            // Force Next.js data reset and navigation
            router.push('/teacher');
            router.refresh();
            
            // Clear any lingering errors about active rooms
            setCreateError('');
        } catch (err: unknown) {
            console.error('Delete room error:', err);
            alert(`Failed to delete room: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setDeletingRoomId(null);
        }
    };

    // Get all selected stage IDs
    const selectedStageIds = CATEGORIES
        .filter(c => selectedCategories.includes(c.key))
        .flatMap(c => c.stages.map(s => s.id));

    // Derived: check if teacher already has an active room
    const hasActiveRoom = activeRooms.some(r => r.status === 'waiting' || r.status === 'playing');

    // Create room with selected categories
    const handleCreateRoom = async () => {
        if (!user) {
            setCreateError('You are not logged in.');
            return;
        }
        if (selectedCategories.length === 0) {
            setCreateError('Please select at least one category.');
            return;
        }

        setCreating(true);
        setCreateError('');

        try {
            // Quick check: already have an active room?
            if (hasActiveRoom) {
                setCreateError(`You already have an active room: ${activeRooms[0]?.room_code}. Delete it first or click Manage.`);
                return;
            }

            const roomCode = generateRoomCode();
            console.log('[CreateRoom] Creating room:', roomCode, 'Categories:', selectedCategories);

            const { data: room, error: insertError } = await supabase
                .from('rooms')
                .insert({
                    room_code: roomCode,
                    teacher_id: user.id,
                    status: 'waiting',
                    categories: selectedCategories
                })
                .select()
                .single();

            if (insertError) {
                console.error('[CreateRoom] Error:', insertError);
                const msg = insertError.message || '';
                if (msg.includes('unique') || msg.includes('duplicate') || insertError.code === '23505') {
                    // Room code collision — try once more with a new code
                    const retryCode = generateRoomCode();
                    const { data: retryRoom, error: retryError } = await supabase
                        .from('rooms')
                        .insert({
                            room_code: retryCode,
                            teacher_id: user.id,
                            status: 'waiting',
                            categories: selectedCategories
                        })
                        .select()
                        .single();

                    if (retryError || !retryRoom) {
                        setCreateError('Could not create room. Please try again.');
                        return;
                    }

                    setActiveRooms(prev => [retryRoom as Room, ...prev]);
                    router.push(`/game/room/${retryRoom.room_code}`);
                    router.refresh();
                    return;
                }
                setCreateError(`Could not create room: ${msg}`);
                return;
            }

            if (!room) {
                setCreateError('Room was not created. Please try again.');
                return;
            }

            console.log('[Room] created:', room.room_code);
            setActiveRooms(prev => [room as Room, ...prev]);
            setCreateError('');
            router.push(`/game/room/${room.room_code}`);
            router.refresh();
        } catch (err) {
            console.error('[CreateRoom] Exception:', err);
            setCreateError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl animate-float-slow mb-4">👨‍🏫</div>
                    <p className="text-white/50 font-[var(--font-display)] text-xl">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a1628]">
            {/* Header */}
            <div className="hero-gradient py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <span className="absolute top-[20%] right-[8%] text-4xl animate-float opacity-30">📋</span>
                    <span className="absolute bottom-[15%] left-[5%] text-3xl animate-float-delay-1 opacity-20">🏆</span>
                </div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <h1 className="text-4xl font-[var(--font-display)] font-bold text-white mb-2">
                        👨‍🏫 Teacher Dashboard
                    </h1>
                    <p className="text-white/60 text-lg">Create rooms, select challenges, and view student scores!</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* ── Step 1: Select Categories ── */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>🎯 Step 1: Select Categories for Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-white/50 mb-5">
                            Choose which categories students will play. You can select multiple categories.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {CATEGORIES.map(cat => {
                                const isSelected = selectedCategories.includes(cat.key);
                                const hasStages = cat.stages.length > 0;

                                return (
                                    <button
                                        key={cat.key}
                                        onClick={() => hasStages && toggleCategory(cat.key)}
                                        disabled={!hasStages}
                                        className={`
                                            relative rounded-2xl p-4 text-center transition-all duration-300 cursor-pointer border-2
                                            ${!hasStages
                                                ? 'opacity-40 cursor-not-allowed border-white/5 bg-white/[0.02]'
                                                : isSelected
                                                    ? 'border-opacity-60 scale-[1.03] shadow-lg'
                                                    : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20'
                                            }
                                        `}
                                        style={isSelected ? {
                                            borderColor: cat.colorHex,
                                            backgroundColor: cat.colorHex + '15',
                                            boxShadow: `0 0 20px ${cat.colorHex}20`,
                                        } : undefined}
                                    >
                                        {/* Checkmark */}
                                        {isSelected && (
                                            <div
                                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                style={{ backgroundColor: cat.colorHex }}
                                            >
                                                ✓
                                            </div>
                                        )}
                                        <span className="text-3xl block mb-2">
                                            {cat.key === 'js' ? <i className="fa-brands fa-js"></i> : cat.icon}
                                        </span>
                                        <span className="text-sm font-[var(--font-display)] font-bold text-white block">{cat.label}</span>
                                        <span className="text-[10px] text-white/40 mt-1 block">
                                            {hasStages ? `${cat.stages.length} stages` : 'Coming Soon'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected stages summary */}
                        {selectedStageIds.length > 0 && (
                            <div className="mt-5 p-4 rounded-xl bg-white/[0.04] border border-white/10">
                                <p className="text-white/60 text-sm mb-2 font-semibold">
                                    📋 Selected Stages ({selectedStageIds.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.filter(c => selectedCategories.includes(c.key)).flatMap(cat =>
                                        cat.stages.map(stage => (
                                            <span
                                                key={stage.id}
                                                className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                                                style={{ backgroundColor: cat.colorHex + '30', border: `1px solid ${cat.colorHex}50` }}
                                            >
                                                {stage.sport} {stage.title}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Step 2: Create Room ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>🏟️ Step 2: Create a Room</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-white/50 mb-6">
                                {hasActiveRoom
                                    ? 'You have an active room. Manage or delete it before creating a new one.'
                                    : 'Create a room with the selected categories. Students will join using the generated room code.'
                                }
                            </p>
                            <Button
                                onClick={handleCreateRoom}
                                disabled={creating || selectedCategories.length === 0 || hasActiveRoom}
                                size="lg"
                                fullWidth
                                className="text-xl py-5"
                            >
                                {creating ? '⏳ Creating Room...' : `🏟️ Create Room (${selectedStageIds.length} stages)`}
                            </Button>
                            {selectedCategories.length === 0 && !hasActiveRoom && (
                                <p className="text-white/30 text-sm mt-3 text-center">
                                    ⬆️ Select at least one category above first
                                </p>
                            )}
                            {createError && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2 mt-4">
                                    <span>⚠️</span> {createError}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Rooms */}
                    <Card>
                        <CardHeader>
                            <CardTitle>📋 Your Active Rooms</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activeRooms.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3 opacity-50">🏟️</div>
                                    <p className="text-white/40 italic">No active rooms. Create one to get started!</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-white/5">
                                    {activeRooms.map((room) => (
                                        <li key={room.id} className="py-4 flex justify-between items-center group">
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    Room:{' '}
                                                    <span className="font-mono bg-white/10 px-2 py-1 rounded-lg text-sky-light tracking-widest">
                                                        {room.room_code}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-white/40 mt-1 flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${room.status === 'waiting' ? 'bg-yellow-400' :
                                                        room.status === 'playing' ? 'bg-green-400 animate-pulse' :
                                                            'bg-gray-400'
                                                        }`}></span>
                                                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={`/game/room/${room.room_code}`}
                                                    className={`text-sky hover:text-sky-light text-sm font-bold transition-colors flex items-center gap-1 group-hover:gap-2 ${creating ? 'pointer-events-none opacity-40' : ''}`}
                                                    aria-disabled={creating}
                                                >
                                                    Manage
                                                    <span className="transition-all">→</span>
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteRoom(room)}
                                                    disabled={deletingRoomId !== null || creating}
                                                    className="text-red-400/60 hover:text-red-400 text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title="Delete room"
                                                >
                                                    {deletingRoomId === room.id ? '⏳' : '🗑️'}
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
