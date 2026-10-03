/*
 * Portfolio content. This file is written by the admin panel (admin.html).
 * You can also edit it by hand: it must stay valid JSON after "window.PORTFOLIO =".
 */
window.PORTFOLIO = {
  "sections": {
    "dna": true,
    "experience": true,
    "projects": true,
    "code": true,
    "skills": true,
    "recognition": true,
    "gallery": true,
    "lab": true,
    "game": true
  },
  "person": {
    "name": "Md. Al Ferdous",
    "role": "Backend Developer",
    "stack": "Python • Django • REST APIs • Scalable Systems",
    "location": "Mohammadpur, Dhaka, Bangladesh",
    "email": "alferdous13@gmail.com",
    "github": "https://github.com/alferdousrana",
    "linkedin": "https://www.linkedin.com/in/al-ferdous-rana/",
    "facebook": "https://www.facebook.com/alferdous.rana",
    "available": true,
    "tagline": "Building systems that turn complex problems into reliable software.",
    "photo": "assets/images/profile.jpg",
    "photoAlt": "Portrait of Md. Al Ferdous"
  },
  "hero": {
    "facts": [
      {
        "label": "led",
        "text": "Backend for a healthcare platform serving 10,000+ users"
      },
      {
        "label": "shipped",
        "text": "Django REST APIs for 2 production client projects"
      },
      {
        "label": "published",
        "text": "alfer-django-authx — a reusable auth package on PyPI"
      }
    ]
  },
  "heroNodes": [
    {
      "label": "Python",
      "info": "Primary language across every backend and package.",
      "connects": [
        "Django"
      ]
    },
    {
      "label": "Django",
      "info": "Primary framework — modular apps, signals, ORM.",
      "connects": [
        "REST API",
        "PostgreSQL"
      ]
    },
    {
      "label": "REST API",
      "info": "APIs for a 10,000+ user healthcare platform.",
      "connects": [
        "JWT"
      ]
    },
    {
      "label": "PostgreSQL",
      "info": "Schemas and query optimization.",
      "connects": []
    },
    {
      "label": "JWT",
      "info": "Access + refresh auth, paired with OTP.",
      "connects": []
    },
    {
      "label": "Architecture",
      "info": "Services, selectors, multi-role design.",
      "connects": [
        "Systems",
        "Django"
      ]
    },
    {
      "label": "Automation",
      "info": "Reusable packages and signal-driven events.",
      "connects": [
        "Systems"
      ]
    },
    {
      "label": "Systems",
      "info": "Production systems, built to stay reliable.",
      "connects": []
    }
  ],
  "about": {
    "title": "Who is running this system",
    "lede": "I design backend systems where authentication, data flow, API contracts and scalability are treated as first-class concerns — not things bolted on after launch.",
    "paragraphs": [
      "From December 2019 to July 2025 I was Backend Lead Engineer at Dhaka Cast Limited, leading the backend for a healthcare platform with a multi-role architecture serving more than 10,000 users. That meant a secure JWT + OTP authentication system, REST APIs built for performance, and database queries tuned so the platform stayed reliable as its user base grew.",
      "At Softvence, from January to May 2026, I built and deployed Django REST APIs for two production client projects — designing their authentication, database schemas and third-party integrations.",
      "The patterns I kept rebuilding, I turned into reusable code: an authentication package with OTP and JWT, and a modular DRF backend organised around services and selectors."
    ]
  },
  "metrics": [
    {
      "value": 10000,
      "suffix": "+",
      "label": "users on the healthcare platform I led backend for"
    },
    {
      "value": 5,
      "suffix": "+ yrs",
      "label": "as Backend Lead Engineer, Dec 2019 – Jul 2025"
    },
    {
      "value": 2,
      "suffix": "",
      "label": "production client projects shipped at Softvence"
    },
    {
      "value": 3,
      "suffix": "",
      "label": "awards and recognitions, including a national award"
    }
  ],
  "profile": [
    {
      "key": "role",
      "value": [
        "Backend Developer"
      ],
      "pipeline": false
    },
    {
      "key": "focus",
      "value": [
        "Scalable systems",
        "REST APIs",
        "Authentication",
        "Architecture"
      ],
      "pipeline": false
    },
    {
      "key": "primary_stack",
      "value": [
        "Python",
        "Django",
        "DRF",
        "PostgreSQL"
      ],
      "pipeline": false
    },
    {
      "key": "mindset",
      "value": [
        "Build",
        "Test",
        "Optimize",
        "Deploy"
      ],
      "pipeline": true
    },
    {
      "key": "based_in",
      "value": [
        "Dhaka, Bangladesh"
      ],
      "pipeline": false
    }
  ],
  "dna": [
    {
      "title": "Clean architecture",
      "glyph": "layers",
      "summary": "Each layer has one job.",
      "detail": "Views handle HTTP, serializers guard the boundary, services hold business rules and selectors own reads. Adkom Backend is built on exactly this split, so every layer stays testable and replaceable."
    },
    {
      "title": "Secure authentication",
      "glyph": "lock",
      "summary": "Identity is verified before anything else runs.",
      "detail": "Email login, OTP verification, JWT access and refresh tokens, OTP-based password reset and role-based permissions — built for a healthcare platform, then packaged once in alfer-django-authx."
    },
    {
      "title": "Scalable APIs",
      "glyph": "branch",
      "summary": "Endpoints are contracts, not side effects.",
      "detail": "Predictable resources, validation at the serializer boundary and a clean, consistent response format. Shipped for a multi-role healthcare platform with 10,000+ users and two production client systems."
    },
    {
      "title": "Database optimization",
      "glyph": "database",
      "summary": "Fewer round-trips, faster answers.",
      "detail": "Schemas designed around how data is read, and queries tuned to avoid waste — the work that kept a 10,000+ user platform reliable. Try the N+1 experiment in the lab to see the idea in motion."
    },
    {
      "title": "Modular systems",
      "glyph": "modules",
      "summary": "Features ship as independent apps.",
      "detail": "Accounts, product, cart, checkout, notification and blog live as separate Django apps with their own models, services and signals, so a feature can change without touching its neighbours."
    },
    {
      "title": "Production mindset",
      "glyph": "deploy",
      "summary": "Done means deployed and dependable.",
      "detail": "Five-plus years leading a production healthcare backend, then building and deploying production-ready systems for real client use cases at Softvence. Reliability is part of the first release, not a later patch."
    }
  ],
  "experience": [
    {
      "company": "Dhaka Cast Limited",
      "role": "Backend Lead Engineer",
      "start": "2019-12",
      "end": "2025-07",
      "current": false,
      "points": [
        "Led the backend for a healthcare platform serving 10,000+ users with a multi-role architecture",
        "Built a secure authentication system with JWT + OTP",
        "Built high-performance REST APIs for the web platform",
        "Optimized database queries to keep the system reliable and scalable for a 10,000+ user base"
      ],
      "signals": [
        "api",
        "auth",
        "database",
        "architecture"
      ],
      "tech": [
        "Python",
        "Django",
        "REST APIs",
        "JWT",
        "OTP"
      ],
      "links": []
    },
    {
      "company": "Softvence",
      "role": "Backend Developer",
      "start": "2026-01",
      "end": "2026-05",
      "current": false,
      "points": [
        "Built and deployed scalable Django REST APIs for 2 production-level client projects",
        "Designed authentication, database schemas and third-party integrations",
        "Delivered production-ready systems for real-world use cases"
      ],
      "signals": [
        "api",
        "auth",
        "database",
        "deployment"
      ],
      "tech": [
        "Python",
        "Django",
        "Django REST Framework"
      ],
      "links": [
        {
          "label": "hello-appart.com",
          "url": "https://hello-appart.com"
        },
        {
          "label": "zarbazan-sd.vercel.app",
          "url": "https://zarbazan-sd.vercel.app"
        }
      ]
    }
  ],
  "projects": [
    {
      "name": "LifeSheba",
      "type": "Healthcare platform",
      "image": "",
      "stack": [
        "Django",
        "REST APIs",
        "JWT",
        "RBAC",
        "React"
      ],
      "meta": "live: lifesheba.vercel.app · source: private",
      "problem": "Patients lose time to waiting rooms and distance. LifeSheba connects them with healthcare services digitally.",
      "built": "System planning and architecture, the full Django backend — models, views, APIs and logic — frontend integration, deployment and hosting.",
      "features": [
        "Doctor profiles & patient management",
        "Nurse & caregiver booking",
        "Vendor dashboard for medicine & products",
        "Lab technician test workflow",
        "Admin-managed health education",
        "Role-based access control"
      ],
      "links": [
        {
          "kind": "live",
          "label": "Visit live site",
          "url": "https://lifesheba.vercel.app/"
        }
      ],
      "case": [
        {
          "h": "Problem",
          "p": "Reaching care involves waiting time and travel. The platform puts doctors, nurses, caregivers, pharmacies and labs behind one digital front door."
        },
        {
          "h": "Architecture",
          "p": "A React frontend talks to a Django backend over REST. Every request is authenticated, then checked against the caller's role before it reaches a module: doctors, patients, nurse & caregiver bookings, vendor orders, lab workflows and health education."
        },
        {
          "h": "Authentication",
          "p": "JWT authentication with role-based access control, so each user type — patient, doctor, nurse or caregiver, vendor, lab technician, admin — sees and changes only what its role allows."
        },
        {
          "h": "Backend & API",
          "p": "Booking and order modules, vendor medicine and product management, lab test request processing and admin-controlled blogs and videos, all exposed as REST APIs designed for the React client."
        },
        {
          "h": "My role",
          "p": "System planning and architecture, backend development (models, views, APIs, logic), frontend integration, deployment and hosting."
        },
        {
          "h": "Deployment",
          "p": "Deployed and live — the frontend is served at lifesheba.vercel.app."
        }
      ],
      "diagram": [
        {
          "label": "Client",
          "sub": "React frontend",
          "tone": "cyan"
        },
        {
          "label": "REST API",
          "sub": "Django",
          "tone": "cyan"
        },
        {
          "label": "Auth",
          "sub": "JWT · role-based access",
          "tone": "violet"
        },
        {
          "label": "Modules",
          "sub": "booking · orders · doctors · vendors · labs · education",
          "tone": "cyan"
        },
        {
          "label": "Database",
          "sub": "secure data handling",
          "tone": "green"
        }
      ]
    },
    {
      "name": "Django Auth Package",
      "type": "Reusable package · PyPI",
      "image": "",
      "stack": [
        "Python",
        "Django",
        "DRF",
        "JWT",
        "OTP"
      ],
      "meta": "pip install alfer-django-authx · repo: alfer-django-authx",
      "problem": "Every Django project rebuilds the same authentication: signup, verification, tokens, password reset, roles. Each rebuild is another chance to get security wrong.",
      "built": "A reusable, production-ready authentication package — install it, configure it with environment variables, and get a complete email + OTP + JWT flow.",
      "features": [
        "Email-based login (no username)",
        "Email OTP verification & resend",
        "JWT access + refresh tokens",
        "OTP-based password reset",
        "Roles: Admin / Manager / User",
        "Custom signals for extensibility"
      ],
      "links": [
        {
          "kind": "github",
          "label": "GitHub",
          "url": "https://github.com/alferdousrana/alfer-django-authx"
        },
        {
          "kind": "package",
          "label": "PyPI",
          "url": "https://pypi.org/project/alfer-django-authx/"
        }
      ],
      "case": [
        {
          "h": "Problem",
          "p": "Authentication logic was being re-implemented project after project. A single, tested package removes the repetition and the risk."
        },
        {
          "h": "Authentication",
          "p": "Signup with email and password, email OTP verification with resend, login returning a JWT access + refresh pair, and forgot/reset password over OTP."
        },
        {
          "h": "Authorization",
          "p": "Role-based permissions for Admin, Manager and User, ready to attach to any view."
        },
        {
          "h": "API",
          "p": "A clean, consistent response format across every endpoint, so frontends handle success and failure the same way."
        },
        {
          "h": "Extensibility",
          "p": "Fully configurable through .env, with custom signals that let a host project react to auth events without forking the package."
        },
        {
          "h": "Outcome",
          "p": "Published on PyPI — one pip install gives a project a complete auth system."
        }
      ],
      "diagram": [
        {
          "label": "Client",
          "sub": "signup · login · reset",
          "tone": "cyan"
        },
        {
          "label": "Auth endpoints",
          "sub": "DRF views",
          "tone": "cyan"
        },
        {
          "label": "OTP verification",
          "sub": "email · resend",
          "tone": "violet"
        },
        {
          "label": "JWT issue",
          "sub": "access + refresh",
          "tone": "violet"
        },
        {
          "label": "Roles & signals",
          "sub": "Admin · Manager · User",
          "tone": "green"
        }
      ]
    },
    {
      "name": "Adkom Backend",
      "type": "Modular commerce backend",
      "image": "",
      "stack": [
        "Python",
        "Django",
        "DRF"
      ],
      "meta": "repo: adkom-backend · pattern: services + selectors",
      "problem": "Commerce backends turn into tangled views fast. Adkom keeps reads, writes and side effects in separate, predictable places.",
      "built": "A modular Django + DRF backend where each domain is its own reusable app, and every app follows the same layered structure.",
      "features": [
        "Apps: core, accounts, product, cart, checkout, notification, blog",
        "selectors.py for read/query logic",
        "services.py for business logic",
        "Signals for events",
        "Notification message builders",
        "Shared base models & utilities"
      ],
      "links": [
        {
          "kind": "github",
          "label": "GitHub",
          "url": "https://github.com/alferdousrana/adkom-backend"
        }
      ],
      "case": [
        {
          "h": "Problem",
          "p": "When business logic lives in views, every new feature means editing code that handles HTTP. That doesn't scale with a team or a product."
        },
        {
          "h": "Architecture",
          "p": "Seven apps — core, accounts, product, cart, checkout, notification, blog. Each separates views (request/response), serializers (DRF layer), services (business logic), selectors (reads) and models (database)."
        },
        {
          "h": "Backend",
          "p": "Signals publish domain events; notification builders turn them into messages. A shared core app holds base models and utilities."
        },
        {
          "h": "Authentication",
          "p": "An accounts app owns users and authentication, isolated from the commerce domains."
        },
        {
          "h": "Outcome",
          "p": "A clean-architecture template where new domains plug in without touching existing ones."
        }
      ],
      "diagram": [
        {
          "label": "views.py",
          "sub": "request / response",
          "tone": "cyan"
        },
        {
          "label": "serializers.py",
          "sub": "DRF boundary",
          "tone": "cyan"
        },
        {
          "label": "services.py",
          "sub": "business logic",
          "tone": "violet"
        },
        {
          "label": "selectors.py",
          "sub": "read & query logic",
          "tone": "violet"
        },
        {
          "label": "models/",
          "sub": "database · signals → notifications",
          "tone": "green"
        }
      ]
    },
    {
      "name": "AlgoVision AI",
      "type": "Algorithm visualization platform",
      "image": "",
      "stack": [
        "Django",
        "DRF",
        "React",
        "Vite",
        "React Flow"
      ],
      "meta": "repo: AlgoVision-AI · engine: 7 algorithms",
      "problem": "Algorithms are easier to understand when you can watch them run step by step.",
      "built": "A Django REST backend with a modular algorithm engine, and a React frontend that renders each execution step visually.",
      "features": [
        "Graph: BFS, DFS, Dijkstra, Prim",
        "Sorting: bubble, merge, quick",
        "Step-by-step execution",
        "Modular engine — one module per algorithm",
        "REST API backend",
        "React Flow visualization"
      ],
      "links": [
        {
          "kind": "github",
          "label": "GitHub",
          "url": "https://github.com/alferdousrana/AlgoVision-AI"
        }
      ],
      "case": [
        {
          "h": "Problem",
          "p": "Reading an algorithm is not the same as seeing it. The platform turns execution into a visual sequence."
        },
        {
          "h": "Architecture",
          "p": "Separate backend and frontend. The Django project exposes the algorithm engine over a REST API; the React (Vite) app requests executions and renders them with React Flow."
        },
        {
          "h": "Backend",
          "p": "An engine package with one module per algorithm — bfs, dfs, dijkstra, prims, bubble_sort, merge_sort, quick_sort — so new algorithms are added without touching existing ones."
        },
        {
          "h": "Outcome",
          "p": "An interactive tool for step-by-step algorithm execution, and the direction I'm growing in: algorithms, visualization and intelligent systems."
        }
      ],
      "diagram": [
        {
          "label": "Client",
          "sub": "React · Vite · React Flow",
          "tone": "cyan"
        },
        {
          "label": "REST API",
          "sub": "Django REST Framework",
          "tone": "cyan"
        },
        {
          "label": "Algorithm engine",
          "sub": "graph & sorting modules",
          "tone": "violet"
        },
        {
          "label": "Execution steps",
          "sub": "returned for rendering",
          "tone": "green"
        }
      ]
    }
  ],
  "repos": [
    {
      "name": "alfer-django-authx",
      "language": "Python",
      "description": "Reusable Django authentication package: email login, OTP verification, password reset, JWT and role-based permissions."
    },
    {
      "name": "adkom-backend",
      "language": "Python",
      "description": "Modular Django + DRF backend with reusable app architecture: services, selectors and signals."
    },
    {
      "name": "AlgoVision-AI",
      "language": "JavaScript",
      "description": "Interactive platform for visualizing algorithms, with a Django REST backend and React frontend."
    },
    {
      "name": "user_management",
      "language": "Python",
      "description": "User management REST API with Django, DRF and JWT: registration, profiles, password change and token blacklisting."
    },
    {
      "name": "Product_Inventory_API",
      "language": "Python",
      "description": "Django API for product inventory with user authentication and full CRUD endpoints."
    },
    {
      "name": "Desh-Medicine",
      "language": "Python",
      "description": "An AI-based online medicine shop."
    }
  ],
  "skills": {
    "center": {
      "label": "Backend engineering",
      "text": "Everything here orbits one job: backends that authenticate users correctly, answer fast and survive growth."
    },
    "nodes": [
      {
        "label": "GitHub",
        "group": "tools",
        "text": "48 public repositories, from auth packages to algorithm visualizers.",
        "connects": []
      },
      {
        "label": "Git",
        "group": "tools",
        "text": "Version control for every project.",
        "connects": [
          "GitHub"
        ]
      },
      {
        "label": "Python",
        "group": "backend",
        "text": "The language behind every backend I ship — APIs, auth packages and algorithm engines.",
        "connects": [
          "Django"
        ]
      },
      {
        "label": "Django",
        "group": "backend",
        "text": "My primary framework: models, apps and signals for modular, production systems.",
        "connects": [
          "DRF",
          "PostgreSQL",
          "MySQL",
          "MVC / MVT"
        ]
      },
      {
        "label": "MVC / MVT",
        "group": "architecture",
        "text": "Django's model-view-template pattern, extended with service and selector layers.",
        "connects": [
          "Modular design"
        ]
      },
      {
        "label": "Modular design",
        "group": "architecture",
        "text": "Independent apps with services and selectors — the backbone of Adkom Backend.",
        "connects": []
      },
      {
        "label": "DRF",
        "group": "backend",
        "text": "Django REST Framework for serializers, views and permissions across every API I build.",
        "connects": [
          "REST API",
          "Modular design",
          "JWT"
        ]
      },
      {
        "label": "REST API",
        "group": "api & auth",
        "text": "API design for a multi-role healthcare platform and two production client projects.",
        "connects": [
          "JWT",
          "Postman"
        ]
      },
      {
        "label": "Postman",
        "group": "tools",
        "text": "Testing and documenting API endpoints before they reach a frontend.",
        "connects": []
      },
      {
        "label": "JWT",
        "group": "api & auth",
        "text": "Access + refresh token authentication, packaged in alfer-django-authx.",
        "connects": [
          "OTP"
        ]
      },
      {
        "label": "OTP",
        "group": "api & auth",
        "text": "Email OTP for verification and password reset, paired with JWT for a secure auth system.",
        "connects": []
      },
      {
        "label": "MySQL",
        "group": "database",
        "text": "Relational database work alongside PostgreSQL.",
        "connects": []
      },
      {
        "label": "PostgreSQL",
        "group": "database",
        "text": "Relational schemas designed around access patterns, with queries tuned for reliability.",
        "connects": [
          "MySQL"
        ]
      }
    ]
  },
  "awards": [
    {
      "top": "2021",
      "name": "Digital Bangladesh Award",
      "honour": "Best Team",
      "issuer": "ICT Division · national",
      "featured": true
    },
    {
      "top": "Top 30",
      "name": "IdeaTHON",
      "honour": "",
      "issuer": "ICT Division & Korea Productivity Center",
      "featured": false
    },
    {
      "top": "Honorable mention",
      "name": "Call for Nation",
      "honour": "",
      "issuer": "",
      "featured": false
    }
  ],
  "education": [
    {
      "degree": "B.Sc. in Computer Science & Engineering",
      "school": "Global University Bangladesh",
      "cgpa": "3.67",
      "scale": "4.00"
    }
  ],
  "certifications": [
    {
      "name": "Full Stack Web Development with Python, Django & React",
      "issuer": "Ostad",
      "year": "2025"
    },
    {
      "name": "Kotlin & Android Jetpack Compose",
      "issuer": "Udemy",
      "year": "2022"
    }
  ],
  "gallery": {
    "title": "Gallery",
    "text": "Moments from work, events and recognition.",
    "items": []
  },
  "contact": {
    "title": "Have a system worth building?",
    "text": "A project, an opportunity, or an interesting engineering problem — let's talk.",
    "button": "Let's build it"
  }
};
