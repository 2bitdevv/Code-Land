'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function JoinRoomForm() {
    const [code, setCode] = useState('');
    const router = useRouter();

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (normalizedCode.length === 6) {
            router.push(`/game/room/${normalizedCode}`);
        }
    };

    return (
        <form onSubmit={handleJoin} className="flex gap-3">
            <input
                type="text"
                placeholder="ABCDEF"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-sky focus:ring-2 focus:ring-sky/30 focus:outline-none px-4 py-3 uppercase font-mono tracking-[0.3em] text-center text-lg"
                maxLength={6}
                required
            />
            <Button type="submit">🚀 Join</Button>
        </form>
    );
}