// js/supabase-client.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// This is the new, crucial part. These headers tell the browser not to cache API requests.
const fetchOptions = {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
};

const { createClient } = window.supabase;

// We now pass the fetchOptions to the client during creation.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
        fetch: (input, init) => {
            // Merge our custom headers with any existing headers
            const headers = new Headers(init?.headers);
            Object.entries(fetchOptions.headers).forEach(([key, value]) => {
                headers.set(key, value);
            });
            return fetch(input, { ...init, headers });
        }
    }
});