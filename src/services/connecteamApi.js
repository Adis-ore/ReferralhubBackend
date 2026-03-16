const CONNECTEAM_BASE = 'https://api.connecteam.com';

async function connecteamFetch(path, apiKey, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${CONNECTEAM_BASE}${path}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Connecteam ${method} ${path} → ${response.status}: ${text}`);
  }
  return response.json();
}

/**
 * List all users in the Connecteam account.
 */
export const listConnecteamUsers = async (apiKey) => {
  return connecteamFetch('/users/v1/users', apiKey);
};

/**
 * Create a new user in Connecteam.
 * NOTE: Connecteam's public API does not currently expose a user-creation endpoint.
 * This function simulates success. When Connecteam provides the endpoint, replace the
 * mock block with the real API call.
 */
export const createConnecteamUser = async (apiKey, userData) => {
  // userData: { firstName, lastName, email, phone, role }

  // --- SIMULATED (replace when Connecteam exposes user creation) ---
  console.log('[Connecteam] Simulating user creation for:', userData.email);
  return {
    success: true,
    connecteamUserId: `ct_${Date.now()}`,
    message: 'User registered (Connecteam account will be created manually — API does not yet expose user creation)',
  };

  // --- REAL (uncomment when available) ---
  // const result = await connecteamFetch('/users/v1/users', apiKey, 'POST', userData);
  // return { success: true, connecteamUserId: result.data?.userId, message: 'Connecteam account created' };
};

/**
 * List all time clocks.
 */
export const listTimeClocks = async (apiKey) => {
  return connecteamFetch('/time-clock/v1/time-clocks', apiKey);
};

/**
 * Get time activities for a specific time clock.
 */
export const getTimeActivities = async (apiKey, timeClockId, limit = 50) => {
  return connecteamFetch(`/time-clock/v1/time-clocks/${timeClockId}/time-activities?limit=${limit}`, apiKey);
};

/**
 * Test the API key by calling /me.
 */
export const testConnection = async (apiKey) => {
  return connecteamFetch('/me', apiKey);
};
