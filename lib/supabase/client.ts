import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (client) return client;

    client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                flowType: 'pkce',
                persistSession: true,
                // Avoid navigator.locks "steal" AbortError spam in Next dev (Strict Mode / fast refresh).
                lock: async (_name, _acquireTimeout, fn) => fn(),
            },
        }
    );

    return client;
}
