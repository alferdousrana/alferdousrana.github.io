/*
 * Portfolio content — single source of truth.
 * Every fact here comes from the CV, the GitHub profile or public repository READMEs.
 * Edit this file to update the site; the page, terminal and case studies all read from it.
 */
window.PORTFOLIO = {
  person: {
    name: 'Md. Al Ferdous',
    role: 'Backend Developer',
    stack: 'Python • Django • REST APIs • Scalable Systems',
    location: 'Mohammadpur, Dhaka, Bangladesh',
    email: 'alferdous13@gmail.com',
    github: 'https://github.com/alferdousrana',
    linkedin: 'https://www.linkedin.com/in/al-ferdous-rana/',
    facebook: 'https://www.facebook.com/alferdous.rana',
    // Set to false to hide the "Available for opportunities" status everywhere.
    available: true
  },

  profile: [
    { key: 'role', value: ['Backend Developer'] },
    { key: 'focus', value: ['Scalable systems', 'REST APIs', 'Authentication', 'Architecture'] },
    { key: 'primary_stack', value: ['Python', 'Django', 'DRF', 'PostgreSQL'] },
    { key: 'mindset', value: ['Build', 'Test', 'Optimize', 'Deploy'], pipeline: true },
    { key: 'based_in', value: ['Dhaka, Bangladesh'] }
  ],

  dna: [
    {
      title: 'Clean architecture',
      glyph: 'layers',
      summary: 'Each layer has one job.',
      detail: 'Views handle HTTP, serializers guard the boundary, services hold business rules and selectors own reads. Adkom Backend is built on exactly this split, so every layer stays testable and replaceable.'
    },
    {
      title: 'Secure authentication',
      glyph: 'lock',
      summary: 'Identity is verified before anything else runs.',
      detail: 'Email login, OTP verification, JWT access and refresh tokens, OTP-based password reset and role-based permissions — built for a healthcare platform, then packaged once in alfer-django-authx.'
    },
    {
      title: 'Scalable APIs',
      glyph: 'branch',
      summary: 'Endpoints are contracts, not side effects.',
      detail: 'Predictable resources, validation at the serializer boundary and a clean, consistent response format. Shipped for a multi-role healthcare platform with 10,000+ users and two production client systems.'
    },
    {
      title: 'Database optimization',
      glyph: 'database',
      summary: 'Fewer round-trips, faster answers.',
      detail: 'Schemas designed around how data is read, and queries tuned to avoid waste — the work that kept a 10,000+ user platform reliable. Try the N+1 experiment in the lab to see the idea in motion.'
    },
    {
      title: 'Modular systems',
      glyph: 'modules',
      summary: 'Features ship as independent apps.',
      detail: 'Accounts, product, cart, checkout, notification and blog live as separate Django apps with their own models, services and signals, so a feature can change without touching its neighbours.'
    },
    {
      title: 'Production mindset',
      glyph: 'deploy',
      summary: 'Done means deployed and dependable.',
      detail: 'Five-plus years leading a production healthcare backend, then building and deploying production-ready systems for real client use cases at Softvence. Reliability is part of the first release, not a later patch.'
    }
  ],

  experience: [
    {
      id: 'dhakacast',
      company: 'Dhaka Cast Limited',
      role: 'Backend Lead Engineer',
      start: '2019-12',
      end: '2025-07',
      period: 'Dec 2019 — Jul 2025',
      duration: '5 yrs 8 mos',
      points: [
        'Led the backend for a healthcare platform serving 10,000+ users with a multi-role architecture',
        'Built a secure authentication system with JWT + OTP',
        'Built high-performance REST APIs for the web platform',
        'Optimized database queries to keep the system reliable and scalable for a 10,000+ user base'
      ],
      signals: ['api', 'auth', 'database', 'architecture'],
      tech: ['Python', 'Django', 'REST APIs', 'JWT', 'OTP'],
      links: []
    },
    {
      id: 'softvence',
      company: 'Softvence',
      role: 'Backend Developer',
      start: '2026-01',
      end: '2026-05',
      period: 'Jan 2026 — May 2026',
      duration: '5 mos',
      points: [
        'Built and deployed scalable Django REST APIs for 2 production-level client projects',
        'Designed authentication, database schemas and third-party integrations',
        'Delivered production-ready systems for real-world use cases'
      ],
      signals: ['api', 'auth', 'database', 'deployment'],
      tech: ['Python', 'Django', 'Django REST Framework'],
      links: [
        { label: 'hello-appart.com', url: 'https://hello-appart.com' },
        { label: 'zarbazan-sd.vercel.app', url: 'https://zarbazan-sd.vercel.app' }
      ]
    }
  ],

  signals: [
    { id: 'api', label: 'API' },
    { id: 'database', label: 'Database' },
    { id: 'auth', label: 'Auth' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'deployment', label: 'Deployment' }
  ],

  projects: [
    {
      id: 'lifesheba',
      name: 'LifeSheba',
      type: 'Healthcare platform',
      stack: ['Django', 'REST APIs', 'JWT', 'RBAC', 'React'],
      meta: 'live: lifesheba.vercel.app · source: private',
      problem: 'Patients lose time to waiting rooms and distance. LifeSheba connects them with healthcare services digitally.',
      built: 'System planning and architecture, the full Django backend — models, views, APIs and logic — frontend integration, deployment and hosting.',
      features: ['Doctor profiles & patient management', 'Nurse & caregiver booking', 'Vendor dashboard for medicine & products', 'Lab technician test workflow', 'Admin-managed health education', 'Role-based access control'],
      links: [{ kind: 'live', label: 'Visit live site', url: 'https://lifesheba.vercel.app/' }],
      case: [
        { h: 'Problem', p: 'Reaching care involves waiting time and travel. The platform puts doctors, nurses, caregivers, pharmacies and labs behind one digital front door.' },
        { h: 'Architecture', p: 'A React frontend talks to a Django backend over REST. Every request is authenticated, then checked against the caller\'s role before it reaches a module: doctors, patients, nurse & caregiver bookings, vendor orders, lab workflows and health education.' },
        { h: 'Authentication', p: 'JWT authentication with role-based access control, so each user type — patient, doctor, nurse or caregiver, vendor, lab technician, admin — sees and changes only what its role allows.' },
        { h: 'Backend & API', p: 'Booking and order modules, vendor medicine and product management, lab test request processing and admin-controlled blogs and videos, all exposed as REST APIs designed for the React client.' },
        { h: 'My role', p: 'System planning and architecture, backend development (models, views, APIs, logic), frontend integration, deployment and hosting.' },
        { h: 'Deployment', p: 'Deployed and live — the frontend is served at lifesheba.vercel.app.' }
      ],
      diagram: [
        { label: 'Client', sub: 'React frontend', tone: 'cyan' },
        { label: 'REST API', sub: 'Django', tone: 'cyan' },
        { label: 'Auth', sub: 'JWT · role-based access', tone: 'violet' },
        { label: 'Modules', sub: 'booking · orders · doctors · vendors · labs · education', tone: 'cyan' },
        { label: 'Database', sub: 'secure data handling', tone: 'green' }
      ]
    },
    {
      id: 'authx',
      name: 'Django Auth Package',
      type: 'Reusable package · PyPI',
      stack: ['Python', 'Django', 'DRF', 'JWT', 'OTP'],
      meta: 'pip install alfer-django-authx · repo: alfer-django-authx',
      problem: 'Every Django project rebuilds the same authentication: signup, verification, tokens, password reset, roles. Each rebuild is another chance to get security wrong.',
      built: 'A reusable, production-ready authentication package — install it, configure it with environment variables, and get a complete email + OTP + JWT flow.',
      features: ['Email-based login (no username)', 'Email OTP verification & resend', 'JWT access + refresh tokens', 'OTP-based password reset', 'Roles: Admin / Manager / User', 'Custom signals for extensibility'],
      links: [
        { kind: 'github', label: 'GitHub', url: 'https://github.com/alferdousrana/alfer-django-authx' },
        { kind: 'package', label: 'PyPI', url: 'https://pypi.org/project/alfer-django-authx/' }
      ],
      case: [
        { h: 'Problem', p: 'Authentication logic was being re-implemented project after project. A single, tested package removes the repetition and the risk.' },
        { h: 'Authentication', p: 'Signup with email and password, email OTP verification with resend, login returning a JWT access + refresh pair, and forgot/reset password over OTP.' },
        { h: 'Authorization', p: 'Role-based permissions for Admin, Manager and User, ready to attach to any view.' },
        { h: 'API', p: 'A clean, consistent response format across every endpoint, so frontends handle success and failure the same way.' },
        { h: 'Extensibility', p: 'Fully configurable through .env, with custom signals that let a host project react to auth events without forking the package.' },
        { h: 'Outcome', p: 'Published on PyPI — one pip install gives a project a complete auth system.' }
      ],
      diagram: [
        { label: 'Client', sub: 'signup · login · reset', tone: 'cyan' },
        { label: 'Auth endpoints', sub: 'DRF views', tone: 'cyan' },
        { label: 'OTP verification', sub: 'email · resend', tone: 'violet' },
        { label: 'JWT issue', sub: 'access + refresh', tone: 'violet' },
        { label: 'Roles & signals', sub: 'Admin · Manager · User', tone: 'green' }
      ]
    },
    {
      id: 'adkom',
      name: 'Adkom Backend',
      type: 'Modular commerce backend',
      stack: ['Python', 'Django', 'DRF'],
      meta: 'repo: adkom-backend · pattern: services + selectors',
      problem: 'Commerce backends turn into tangled views fast. Adkom keeps reads, writes and side effects in separate, predictable places.',
      built: 'A modular Django + DRF backend where each domain is its own reusable app, and every app follows the same layered structure.',
      features: ['Apps: core, accounts, product, cart, checkout, notification, blog', 'selectors.py for read/query logic', 'services.py for business logic', 'Signals for events', 'Notification message builders', 'Shared base models & utilities'],
      links: [{ kind: 'github', label: 'GitHub', url: 'https://github.com/alferdousrana/adkom-backend' }],
      case: [
        { h: 'Problem', p: 'When business logic lives in views, every new feature means editing code that handles HTTP. That doesn\'t scale with a team or a product.' },
        { h: 'Architecture', p: 'Seven apps — core, accounts, product, cart, checkout, notification, blog. Each separates views (request/response), serializers (DRF layer), services (business logic), selectors (reads) and models (database).' },
        { h: 'Backend', p: 'Signals publish domain events; notification builders turn them into messages. A shared core app holds base models and utilities.' },
        { h: 'Authentication', p: 'An accounts app owns users and authentication, isolated from the commerce domains.' },
        { h: 'Outcome', p: 'A clean-architecture template where new domains plug in without touching existing ones.' }
      ],
      diagram: [
        { label: 'views.py', sub: 'request / response', tone: 'cyan' },
        { label: 'serializers.py', sub: 'DRF boundary', tone: 'cyan' },
        { label: 'services.py', sub: 'business logic', tone: 'violet' },
        { label: 'selectors.py', sub: 'read & query logic', tone: 'violet' },
        { label: 'models/', sub: 'database · signals → notifications', tone: 'green' }
      ]
    },
    {
      id: 'algovision',
      name: 'AlgoVision AI',
      type: 'Algorithm visualization platform',
      stack: ['Django', 'DRF', 'React', 'Vite', 'React Flow'],
      meta: 'repo: AlgoVision-AI · engine: 7 algorithms',
      problem: 'Algorithms are easier to understand when you can watch them run step by step.',
      built: 'A Django REST backend with a modular algorithm engine, and a React frontend that renders each execution step visually.',
      features: ['Graph: BFS, DFS, Dijkstra, Prim', 'Sorting: bubble, merge, quick', 'Step-by-step execution', 'Modular engine — one module per algorithm', 'REST API backend', 'React Flow visualization'],
      links: [{ kind: 'github', label: 'GitHub', url: 'https://github.com/alferdousrana/AlgoVision-AI' }],
      case: [
        { h: 'Problem', p: 'Reading an algorithm is not the same as seeing it. The platform turns execution into a visual sequence.' },
        { h: 'Architecture', p: 'Separate backend and frontend. The Django project exposes the algorithm engine over a REST API; the React (Vite) app requests executions and renders them with React Flow.' },
        { h: 'Backend', p: 'An engine package with one module per algorithm — bfs, dfs, dijkstra, prims, bubble_sort, merge_sort, quick_sort — so new algorithms are added without touching existing ones.' },
        { h: 'Outcome', p: 'An interactive tool for step-by-step algorithm execution, and the direction I\'m growing in: algorithms, visualization and intelligent systems.' }
      ],
      diagram: [
        { label: 'Client', sub: 'React · Vite · React Flow', tone: 'cyan' },
        { label: 'REST API', sub: 'Django REST Framework', tone: 'cyan' },
        { label: 'Algorithm engine', sub: 'graph & sorting modules', tone: 'violet' },
        { label: 'Execution steps', sub: 'returned for rendering', tone: 'green' }
      ]
    }
  ],

  // Static snapshot. main.js refreshes stars/language from the GitHub API when reachable.
  repos: [
    { name: 'alfer-django-authx', language: 'Python', stars: 0, description: 'Reusable Django authentication package: email login, OTP verification, password reset, JWT and role-based permissions.' },
    { name: 'adkom-backend', language: 'Python', stars: 0, description: 'Modular Django + DRF backend with reusable app architecture: services, selectors and signals.' },
    { name: 'AlgoVision-AI', language: 'JavaScript', stars: 0, description: 'Interactive platform for visualizing algorithms, with a Django REST backend and React frontend.' },
    { name: 'user_management', language: 'Python', stars: 0, description: 'User management REST API with Django, DRF and JWT: registration, profiles, password change and token blacklisting.' },
    { name: 'Product_Inventory_API', language: 'Python', stars: 0, description: 'Django API for product inventory with user authentication and full CRUD endpoints.' },
    { name: 'Desh-Medicine', language: 'Python', stars: 0, description: 'An AI-based online medicine shop.' }
  ],

  skills: {
    center: { id: 'core', label: 'Backend engineering' },
    nodes: [
      { id: 'github', label: 'GitHub', group: 'tools', text: '48 public repositories, from auth packages to algorithm visualizers.' },
      { id: 'git', label: 'Git', group: 'tools', text: 'Version control for every project.' },
      { id: 'python', label: 'Python', group: 'backend', text: 'The language behind every backend I ship — APIs, auth packages and algorithm engines.' },
      { id: 'django', label: 'Django', group: 'backend', text: 'My primary framework: models, apps and signals for modular, production systems.' },
      { id: 'mvt', label: 'MVC / MVT', group: 'architecture', text: 'Django\'s model-view-template pattern, extended with service and selector layers.' },
      { id: 'modular', label: 'Modular design', group: 'architecture', text: 'Independent apps with services and selectors — the backbone of Adkom Backend.' },
      { id: 'drf', label: 'DRF', group: 'backend', text: 'Django REST Framework for serializers, views and permissions across every API I build.' },
      { id: 'rest', label: 'REST API', group: 'api & auth', text: 'API design for a multi-role healthcare platform and two production client projects.' },
      { id: 'postman', label: 'Postman', group: 'tools', text: 'Testing and documenting API endpoints before they reach a frontend.' },
      { id: 'jwt', label: 'JWT', group: 'api & auth', text: 'Access + refresh token authentication, packaged in alfer-django-authx.' },
      { id: 'otp', label: 'OTP', group: 'api & auth', text: 'Email OTP for verification and password reset, paired with JWT for a secure auth system.' },
      { id: 'mysql', label: 'MySQL', group: 'database', text: 'Relational database work alongside PostgreSQL.' },
      { id: 'postgres', label: 'PostgreSQL', group: 'database', text: 'Relational schemas designed around access patterns, with queries tuned for reliability.' }
    ],
    edges: [
      ['python', 'django'], ['django', 'drf'], ['drf', 'rest'], ['rest', 'jwt'], ['jwt', 'otp'],
      ['django', 'postgres'], ['django', 'mysql'], ['postgres', 'mysql'], ['django', 'mvt'],
      ['mvt', 'modular'], ['drf', 'modular'], ['git', 'github'], ['rest', 'postman'], ['drf', 'jwt']
    ]
  },

  heroNodes: [
    { id: 'python', label: 'Python', info: 'Primary language across every backend and package.' },
    { id: 'django', label: 'Django', info: 'Primary framework — modular apps, signals, ORM.' },
    { id: 'rest', label: 'REST API', info: 'APIs for a 10,000+ user healthcare platform.' },
    { id: 'postgres', label: 'PostgreSQL', info: 'Schemas and query optimization.' },
    { id: 'jwt', label: 'JWT', info: 'Access + refresh auth, paired with OTP.' },
    { id: 'arch', label: 'Architecture', info: 'Services, selectors, multi-role design.' },
    { id: 'auto', label: 'Automation', info: 'Reusable packages and signal-driven events.' },
    { id: 'systems', label: 'Systems', info: 'Production systems, built to stay reliable.' }
  ],
  heroEdges: [['python', 'django'], ['django', 'rest'], ['rest', 'jwt'], ['django', 'postgres'], ['arch', 'systems'], ['auto', 'systems'], ['arch', 'django']]
};
