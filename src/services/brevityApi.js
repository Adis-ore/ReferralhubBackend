/**
 * Brevity API Service
 * Base URL : https://api.brevity.com.au/table/{entity}
 * Auth     : Basic Auth — username = BREVITY_COMPANY_CODE, password = BREVITY_API_KEY
 *
 * ── TO ACTIVATE ──────────────────────────────────────────────────────────────
 * Add to Backend/.env:
 *   BREVITY_COMPANY_CODE=your_company_code_here
 *   BREVITY_API_KEY=your_api_key_here
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BREVITY_BASE = 'https://api.brevity.com.au/table';

function buildAuthHeader(companyCode, apiKey) {
  if (!companyCode || !apiKey) return null;
  return `Basic ${Buffer.from(`${companyCode}:${apiKey}`).toString('base64')}`;
}

async function brevityFetchAll(entity, { companyCode, apiKey, params = {} } = {}) {
  const auth = buildAuthHeader(companyCode, apiKey);
  if (!auth) throw new Error('Brevity credentials not configured (BREVITY_COMPANY_CODE / BREVITY_API_KEY)');

  let allItems = [];
  let pageNum  = 0;
  let totalPages = 1;

  while (pageNum < totalPages) {
    const qs  = new URLSearchParams({ page: pageNum, size: 100, ...params }).toString();
    const url = `${BREVITY_BASE}/${entity}?${qs}`;

    const response = await fetch(url, {
      headers: { Authorization: auth, Accept: 'application/json' },
    });

    if (response.status === 401) throw new Error('Brevity: Invalid company code or API key (401)');
    if (response.status === 403) throw new Error('Brevity: Access denied (403)');
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Brevity ${entity} → ${response.status}: ${text}`);
    }

    const json = await response.json();

    if (Array.isArray(json)) {
      allItems = allItems.concat(json);
      break;
    } else if (json.content) {
      allItems  = allItems.concat(json.content);
      totalPages = json.page?.totalPages ?? 1;
      pageNum++;
    } else {
      allItems = Array.isArray(json) ? json : (json._embedded ? Object.values(json._embedded)[0] : [json]);
      break;
    }
  }

  return allItems;
}

// ─────────────────────────────────────────────────────────────────────────────

/** Test connection — returns { success, message } */
export const testBrevityConnection = async (companyCode, apiKey) => {
  try {
    const qs  = new URLSearchParams({ page: 0, size: 1 }).toString();
    const url = `${BREVITY_BASE}/user?${qs}`;
    const res = await fetch(url, {
      headers: { Authorization: buildAuthHeader(companyCode, apiKey), Accept: 'application/json' },
    });
    if (res.status === 401) return { success: false, message: 'Invalid company code or API key' };
    if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
    const json = await res.json();
    const count = json?.page?.totalElements ?? (Array.isArray(json) ? json.length : '?');
    return { success: true, message: `Connected. Found ${count} user(s).` };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

/** Fetch all active staff from Brevity user table */
export const getBrevityUsers = async (companyCode, apiKey) => {
  return brevityFetchAll('user', { companyCode, apiKey, params: { filter: 'inactive::No' } });
};

/**
 * Fetch approved timesheets from Brevity within a date range.
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate   YYYY-MM-DD
 *
 * ── NOTE ─────────────────────────────────────────────────────────────────────
 * Timesheet field names will be confirmed once the API key is active.
 * Expected fields: id, employeeId, employeeName, date, startTime, endTime,
 *                  totalHours, status (Approved/Pending/Rejected)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const getBrevityTimesheets = async (companyCode, apiKey, startDate, endDate) => {
  return brevityFetchAll('timesheet', {
    companyCode,
    apiKey,
    // ── PLACEHOLDER: filter params will be confirmed once API key is provided ──
    params: { filter: `startdate::${startDate}` },
  });
};
