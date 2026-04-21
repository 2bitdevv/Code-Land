import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ScoreWithProfile, PlayerWithProfile } from '@/lib/types';

const supabase = createClient();

async function fetchPlayersQuery(roomId: string) {
    let { data, error } = await supabase
        .from('room_players')
        .select('*, profiles(username)')
        .eq('room_id', roomId);

    if (error && /PGRST200|relationship|embedded|schema cache/i.test(error.message)) {
        const plain = await supabase.from('room_players').select('*').eq('room_id', roomId);
        data = plain.data;
    }
    return (data as unknown as PlayerWithProfile[]) || [];
}

export function useRoomPlayers(roomId: string | null) {
    const [players, setPlayers] = useState<PlayerWithProfile[]>([]);

    const fetchPlayers = useCallback(async () => {
        if (!roomId) return;
        const rows = await fetchPlayersQuery(roomId);
        setPlayers(rows);
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return;

        let cancelled = false;
        const run = async () => {
            const rows = await fetchPlayersQuery(roomId);
            if (!cancelled) setPlayers(rows);
        };
        void run();

        const channel = supabase
            .channel(`room_players_${roomId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
                () => {
                    void fetchPlayers();
                },
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') void fetchPlayers();
            });

        const onVisible = () => {
            if (document.visibilityState === 'visible') void fetchPlayers();
        };
        document.addEventListener('visibilitychange', onVisible);
        const poll = window.setInterval(() => void fetchPlayers(), 12000);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisible);
            window.clearInterval(poll);
            supabase.removeChannel(channel);
        };
    }, [roomId, fetchPlayers]);

    return { players, refetchPlayers: fetchPlayers };
}

async function fetchScoresQuery(roomId: string) {
    let { data, error } = await supabase
        .from('room_scores')
        .select('*, profiles(username)')
        .eq('room_id', roomId)
        .order('score', { ascending: false })
        .order('time', { ascending: true });

    if (error && /PGRST200|relationship|embedded|schema cache/i.test(error.message)) {
        const plain = await supabase
            .from('room_scores')
            .select('*')
            .eq('room_id', roomId)
            .order('score', { ascending: false })
            .order('time', { ascending: true });
        data = plain.data;
    }
    return (data as unknown as ScoreWithProfile[]) || [];
}

export function useRoomScores(roomId: string | null) {
    const [scores, setScores] = useState<ScoreWithProfile[]>([]);

    const fetchScores = useCallback(async () => {
        if (!roomId) return;
        const rows = await fetchScoresQuery(roomId);
        setScores(rows);
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return;

        let cancelled = false;
        const run = async () => {
            const rows = await fetchScoresQuery(roomId);
            if (!cancelled) setScores(rows);
        };
        void run();

        const channel = supabase
            .channel(`room_scores_${roomId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'room_scores', filter: `room_id=eq.${roomId}` },
                () => {
                    void fetchScores();
                },
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') void fetchScores();
            });

        const onVisible = () => {
            if (document.visibilityState === 'visible') void fetchScores();
        };
        document.addEventListener('visibilitychange', onVisible);
        const poll = window.setInterval(() => void fetchScores(), 12000);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisible);
            window.clearInterval(poll);
            supabase.removeChannel(channel);
        };
    }, [roomId, fetchScores]);

    return { scores, refetchScores: fetchScores };
}
