'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        async function fetchProfile(userId: string): Promise<Profile | null> {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();
                return data as Profile | null;
            } catch {
                return null;
            }
        }

        // Timeout safety — if auth takes more than 5 seconds, force loading=false
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        // Use onAuthStateChange as the SINGLE source of truth.
        // It fires immediately with INITIAL_SESSION, so we don't need
        // a separate getUser() call that would race for the auth lock.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: { user: User } | null) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    clearTimeout(timeout);
                    return;
                }

                /** SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED — อัปเดต user จาก session ล่าสุด (กันเมล/โปรไฟล์ค้างหลังสมัครใหม่หรือเปลี่ยนอีเมล) */
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    const p = await fetchProfile(currentUser.id);
                    setProfile(p);
                } else {
                    setProfile(null);
                }
                setLoading(false);
                clearTimeout(timeout);
            }
        );

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
