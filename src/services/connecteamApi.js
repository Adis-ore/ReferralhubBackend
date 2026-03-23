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

// ── Connecteam custom field IDs (fetched 2026-03-23 via /users/v1/custom-fields) ──
const CF = {
  TITLE:       24930095,   // str
  START_DATE:  24930096,   // date  (DD/MM/YYYY)
  TEAM:        24930097,   // dropdown: Team 1(0) Team 2(1) Team 3(2)
  DEPARTMENT:  24930098,   // dropdown: On-Site Security Staff(0) Supervisor & Scheduling(1) Administrative Support(2)
  ROLE:        24930099,   // dropdown: Security Guard(0) Patrol Officer(1) Site Supervisor(2) Security Manager(3) Dispatcher(4)
  BIRTHDAY:    24930105,   // date  (DD/MM/YYYY)
  GENDER:      24930106,   // dropdown: Male(0) Female(1) Other(2)
};

const DEPARTMENT_MAP = {
  'On-Site Security Staff':    0,
  'Supervisor & Scheduling':   1,
  'Administrative Support':    2,
};

const GENDER_MAP = {
  male:   0,
  female: 1,
  other:  2,
};

/** Format a YYYY-MM-DD string to DD/MM/YYYY for Connecteam date fields */
function toConnecteamDate(iso) {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Create a new user in Connecteam.
 * Endpoint: POST /users/v1/users?sendActivation=false
 * Body must be array-wrapped: [{ userType, isArchived, firstName, lastName, phoneNumber, email, customFields[] }]
 * Phone must be in international format: +61xxxxxxxxx (AU) or +44xxxxxxxxxx (UK)
 * Returns: { success, connecteamUserId, kioskCode, message }
 */
export const createConnecteamUser = async (apiKey, userData) => {
  // userData: { firstName, lastName, email, phoneNumber, gender, dob, classification, department, joinDate }
  const MAX_RETRIES = 3;

  // Build customFields array — only include fields that have a value
  const customFields = [];

  if (userData.classification) {
    customFields.push({ customFieldId: CF.TITLE, value: userData.classification });
  }
  if (userData.dob) {
    customFields.push({ customFieldId: CF.BIRTHDAY, value: toConnecteamDate(userData.dob) });
  }
  if (userData.joinDate) {
    customFields.push({ customFieldId: CF.START_DATE, value: toConnecteamDate(userData.joinDate) });
  }
  if (userData.gender && GENDER_MAP[userData.gender.toLowerCase()] !== undefined) {
    const gId = GENDER_MAP[userData.gender.toLowerCase()];
    customFields.push({ customFieldId: CF.GENDER, value: [{ id: gId, value: userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) }] });
  }
  if (userData.department && DEPARTMENT_MAP[userData.department] !== undefined) {
    const dId = DEPARTMENT_MAP[userData.department];
    customFields.push({ customFieldId: CF.DEPARTMENT, value: [{ id: dId, value: userData.department }] });
  }

  const payload = [{
    userType:    'user',
    isArchived:  false,
    firstName:   userData.firstName,
    lastName:    userData.lastName,
    phoneNumber: userData.phoneNumber,
    email:       userData.email,
    customFields,
  }];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let response;
    try {
      response = await fetch(
        `${CONNECTEAM_BASE}/users/v1/users?sendActivation=false`,
        {
          method: 'POST',
          headers: {
            'X-API-KEY':     apiKey,
            'Content-Type':  'application/json',
            'Accept':        'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
    } catch (networkErr) {
      if (attempt === MAX_RETRIES) {
        return { success: false, connecteamUserId: null, message: `Network error: ${networkErr.message}` };
      }
      await new Promise((r) => setTimeout(r, attempt * 2000));
      continue;
    }

    // Rate limited — wait and retry
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') ?? '5', 10);
      console.warn(`[Connecteam] Rate limited (429). Retrying in ${retryAfter}s… (attempt ${attempt}/${MAX_RETRIES})`);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      return { success: false, connecteamUserId: null, message: 'Connecteam rate limit exceeded' };
    }

    const json = await response.json().catch(() => ({}));

    if (response.ok) {
      const result = json?.data?.results?.[0] ?? {};
      const connecteamUserId = result.userId   ?? null;
      const kioskCode        = result.kioskCode ?? null;
      console.log(`[Connecteam] User created — userId: ${connecteamUserId}, kioskCode: ${kioskCode}`);
      return { success: true, connecteamUserId, kioskCode, message: 'Connecteam account created' };
    }

    // Non-retryable error
    const errMsg = JSON.stringify(json);
    console.error(`[Connecteam] createUser failed (${response.status}):`, errMsg);
    return { success: false, connecteamUserId: null, message: `Connecteam error ${response.status}: ${errMsg}` };
  }

  return { success: false, connecteamUserId: null, message: 'Connecteam user creation failed after retries' };
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
