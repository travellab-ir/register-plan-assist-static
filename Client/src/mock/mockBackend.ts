/**
 * ==========================================================================
 *  MOCK BACKEND — FOR LOCAL UI PREVIEW ONLY (no OAuth, no SQL Server needed)
 * ==========================================================================
 * This file fakes:
 *   1) The login/authentication step (so the app never redirects to
 *      login.mahan.aero).
 *   2) Every `/api/...` call the client makes, by intercepting `window.fetch`
 *      and returning realistic sample data instead of hitting a real server.
 *
 * HOW TO USE:
 *   Import this file as the very FIRST line of `Client/src/index.tsx`:
 *
 *       import './mock/mockBackend';
 *
 *   Then just run the client normally:
 *       cd Client
 *       npm install
 *       npm start
 *
 * To go back to the real backend later, just remove that import line.
 * ==========================================================================
 */

// ---------------------------------------------------------------------------
// 0) Seed window.config — normally set by a <script src="/api/config/init">
//    tag from the real server. On static hosting that request 404s, leaving
//    window.config undefined, which crashes the app during render (blank
//    page, e.g. AppBar reads config.version) since there's no error boundary.
// ---------------------------------------------------------------------------

(window as any).config = {
  env: 'production',
  version: 'mock',
  oauth: {
    serverUrl: '',
    serverIssuer: '',
    clientUrl: '',
    clientId: '',
    resourceName: '',
    lang: 'en'
  }
};

// ---------------------------------------------------------------------------
// 1) Seed a fake logged-in session in localStorage (bypasses OAuth redirect)
// ---------------------------------------------------------------------------

const fakeUser = { id: 'user-1', name: 'demo.user', displayName: 'کاربر دمو' };

const fakeUserSettings = {
  stcColors: { PAX: '#3f51b5', CARGO: '#8e24aa', DEAD: '#757575' }
};

function seed(key: string, value: any) {
  if (localStorage.getItem(key) === null) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

seed('oauthCode', 'mock-oauth-code');
seed('refreshToken', 'mock-refresh-token');
seed('user', fakeUser);
seed('userSettings', fakeUserSettings);
seed('encodedAuthenticationHeader', 'mock-encoded-authentication-header');

// ---------------------------------------------------------------------------
// 2) Sample master data (airports, aircraft types, registers, stcs, seasons)
// ---------------------------------------------------------------------------

const airports = [
  { id: 'IKA', name: 'IKA', fullName: 'Tehran Imam Khomeini', international: true, utcOffsets: [] },
  { id: 'MHD', name: 'MHD', fullName: 'Mashhad', international: false, utcOffsets: [] },
  { id: 'THR', name: 'THR', fullName: 'Tehran Mehrabad', international: false, utcOffsets: [] },
  { id: 'DXB', name: 'DXB', fullName: 'Dubai', international: true, utcOffsets: [] },
  { id: 'IST', name: 'IST', fullName: 'Istanbul', international: true, utcOffsets: [] }
];

const aircraftTypes = [
  {
    id: 'A300',
    name: 'A300',
    displayOrder: 1,
    turnrounds: [
      {
        startDate: '2020-01-01',
        endDate: '2030-01-01',
        minimumGroundTime: { departureDomestic: 45, departureInternational: 90, transitDomestic: 30, transitInternational: 60 }
      }
    ]
  },
  {
    id: 'A310',
    name: 'A310',
    displayOrder: 2,
    turnrounds: [
      {
        startDate: '2020-01-01',
        endDate: '2030-01-01',
        minimumGroundTime: { departureDomestic: 45, departureInternational: 90, transitDomestic: 30, transitInternational: 60 }
      }
    ]
  }
];

const aircraftRegisters = [
  { id: 'EP-MNA', name: 'EP-MNA', aircraftTypeId: 'A300', validPeriods: [{ startDate: '2020-01-01', endDate: '2030-01-01' }] },
  { id: 'EP-MNB', name: 'EP-MNB', aircraftTypeId: 'A300', validPeriods: [{ startDate: '2020-01-01', endDate: '2030-01-01' }] },
  { id: 'EP-MNC', name: 'EP-MNC', aircraftTypeId: 'A310', validPeriods: [{ startDate: '2020-01-01', endDate: '2030-01-01' }] }
];

const stcs = [
  { id: 'PAX', name: 'PAX', description: 'Passenger' },
  { id: 'CARGO', name: 'CARGO', description: 'Cargo' }
];

const seasonTypes = [{ id: 'SUMMER', name: 'Summer' }];
const seasons = [{ id: 'S24', name: 'Summer 2024', seasonTypeId: 'SUMMER', startDate: '2024-03-20', endDate: '2024-09-20' }];
const aircraftRegisterGroups: any[] = [];
const constraintTemplates: any[] = [];
const constraints: any[] = [];

const masterData = {
  aircraftTypes,
  aircraftRegisters,
  airports,
  seasonTypes,
  seasons,
  stcs,
  aircraftRegisterGroups,
  constraintTemplates,
  constraints
};

// ---------------------------------------------------------------------------
// 3) Sample preplan (header + flight requirements + flights)
// ---------------------------------------------------------------------------

const preplanId = 'preplan-1';

const preplanHeader = {
  id: preplanId,
  name: 'برنامه نمونه — تابستان ۱۴۰۳',
  published: false,
  accepted: false,
  user: fakeUser,
  creationDateTime: new Date().toISOString(),
  startDate: '2024-06-01',
  endDate: '2024-06-30'
};

const preplanVersion = {
  id: 'version-1',
  current: true,
  lastEditDateTime: new Date().toISOString(),
  description: 'نسخه اولیه'
};

const preplan = {
  ...preplanVersion,
  dummyAircraftRegisters: [],
  aircraftRegisterOptions: {
    options: aircraftRegisters.map(r => ({ aircraftRegisterId: r.id, status: 'BACKUP' as const, baseAirportId: 'IKA' }))
  }
};

const flightRequirementId = 'fr-1';

const flightRequirements = [
  {
    id: flightRequirementId,
    label: 'W5-101',
    category: 'Domestic',
    stcId: 'PAX',
    aircraftSelection: { includedIdentities: [{ type: 'TYPE', entityId: 'A300' }], excludedIdentities: [] },
    rsx: 'REAL',
    notes: 'پرواز نمونه تهران - مشهد',
    ignored: false,
    localTime: true,
    route: [
      {
        flightNumber: 'W51001',
        departureAirportId: 'IKA',
        arrivalAirportId: 'MHD',
        blockTime: 75,
        stdLowerBound: 6 * 60,
        originPermission: true,
        destinationPermission: true,
        originPermissionNote: '',
        destinationPermissionNote: ''
      }
    ],
    days: [0, 2, 4].map(day => ({
      aircraftSelection: { includedIdentities: [{ type: 'TYPE', entityId: 'A300' }], excludedIdentities: [] },
      rsx: 'REAL',
      day,
      notes: '',
      route: [
        {
          blockTime: 75,
          stdLowerBound: 6 * 60,
          originPermission: true,
          destinationPermission: true,
          originPermissionNote: '',
          destinationPermissionNote: ''
        }
      ]
    })),
    changes: []
  }
];

function dateOfWeekday(day: number): string {
  // Returns a sample date (within the preplan range) for the given weekday index.
  const base = new Date('2024-06-01'); // Saturday
  const d = new Date(base);
  d.setDate(base.getDate() + day);
  return d.toISOString().slice(0, 10);
}

const flights = [0, 2, 4].map((day, i) => ({
  id: `flight-${i + 1}`,
  flightRequirementId,
  date: dateOfWeekday(day),
  aircraftRegisterId: aircraftRegisters[i % aircraftRegisters.length].id,
  legs: [{ std: 6 * 60 }]
}));

let preplanHeaders = [{ ...preplanHeader, versions: [preplanVersion] }];

function getPreplanDataModel() {
  return {
    header: preplanHeader,
    preplan,
    versions: [preplanVersion],
    flightRequirements,
    flights
  };
}

// ---------------------------------------------------------------------------
// 4) Fetch interceptor
// ---------------------------------------------------------------------------

const realFetch = window.fetch.bind(window);

function ok(value: any): Response {
  return new Response(JSON.stringify({ value }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

window.fetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : (input as Request).url;

  if (!url.startsWith('/api/')) return realFetch(input, init);

  const path = url.replace('/api/', '');
  const [service, command] = path.split('/');
  const body = init?.body ? JSON.parse(init.body as string) : {};

  console.log(`%c[mock-api] ${service}/${command}`, 'color:#8e24aa', body);

  await new Promise(resolve => setTimeout(resolve, 150)); // tiny fake network delay

  switch (`${service}/${command}`) {
    case 'oauth/get-authentication':
      return ok({
        encodedAuthenticationHeader: 'mock-encoded-authentication-header',
        authentication: { refreshToken: 'mock-refresh-token', user: fakeUser, userSettings: fakeUserSettings }
      });

    case 'master-data/get':
      return ok(masterData);

    case 'preplan-header/get-all':
      return ok(preplanHeaders);

    case 'preplan-header/create-empty': {
      const newId = `preplan-${preplanHeaders.length + 1}`;
      preplanHeaders = [
        ...preplanHeaders,
        {
          id: newId,
          name: body.newPreplanHeader?.name || 'برنامه جدید',
          published: false,
          accepted: false,
          user: fakeUser,
          creationDateTime: new Date().toISOString(),
          startDate: body.newPreplanHeader?.startDate || '2024-06-01',
          endDate: body.newPreplanHeader?.endDate || '2024-06-30',
          versions: [preplanVersion]
        }
      ];
      return ok(newId);
    }

    case 'preplan/get':
      return ok(getPreplanDataModel());

    case 'preplan-header/edit':
    case 'preplan-header/set-published':
    case 'preplan-header/remove':
      return ok(preplanHeaders);

    case 'preplan/commit':
    case 'preplan/accept':
    case 'preplan/remove':
    case 'preplan/set-aircraft-registers':
    case 'flight-requirement/add':
    case 'flight-requirement/remove':
    case 'flight-requirement/edit':
    case 'flight/edit':
      // For a UI-only demo we just echo back the current sample data.
      return ok(getPreplanDataModel());

    default:
      console.warn(`[mock-api] Unhandled endpoint: ${service}/${command} — returning empty object.`);
      return ok({});
  }
};

export {};
