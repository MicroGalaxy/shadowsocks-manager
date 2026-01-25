# AGENTS.md

Guidance for AI coding agents working with the Shadowsocks Manager (ssmgr) codebase.

## Project Overview

Multi-user Shadowsocks proxy management tool with two server types:
- Type `s` (Server): Runs on each SS server, manages local instances
- Type `m` (Manager): Central node controlling multiple servers

## Build/Lint/Test Commands

```bash
npm install          # Install dependencies
npm start            # Run application (or: node server.js)
npm run build        # Build frontend assets (Gulp)
npm run check        # Run ESLint
npm run fix          # Auto-fix ESLint issues

# Single file operations
npx eslint path/to/file.js
npx eslint path/to/file.js --fix
```

**Note:** No test suite exists in this project.

## Code Style Guidelines

### ESLint Rules (Enforced)
- `semi`: Required semicolons (error)
- `no-unreachable`: No unreachable code (error)
- `eol-last`: Newline at end of file (error)
- `no-console`: Warning level
- Parser: babel-eslint, ECMAScript 6

### Import Patterns

```javascript
// Internal modules - use appRequire() (defined in init/utils.js)
const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();
const account = appRequire('plugins/account/index');

// Node.js built-ins and NPM packages - use require()
const fs = require('fs');
const moment = require('moment');
```

Import order: Built-ins > NPM packages > Internal appRequire modules

### Async/Await Patterns

```javascript
exports.getAccount = async (req, res) => {
  try {
    const accounts = await account.getAccount({ userId: req.session.user });
    res.send(accounts);
  } catch (err) {
    console.log(err);
    res.status(403).end();
  }
};
```

Promise chains acceptable in legacy code.

### Error Handling

Express routes: Wrap in try-catch, log errors, return 403/500:
```javascript
try {
  res.send(result);
} catch (err) {
  console.log(err);
  res.status(403).end();
}
```

### Naming Conventions
- **Files**: camelCase (`flowSaver.js`, `adminAccount.js`)
- **Variables/Functions**: camelCase (`getAccount`, `userId`)
- **Database tables**: snake_case (`account_plugin`, `webgui_order`)
- **Exports**: Arrow functions (`exports.getAccount = async (req, res) => {}`)

### Database Access (Knex.js)

```javascript
const result = await knex('account_plugin').select().where({ id });
const [id] = await knex('table').insert({ ... });
await knex('table').update({ port }).where({ id });
await knex('table').where({ id }).del();
```

### Express Routes

Validation with express-validator:
```javascript
req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
req.getValidationResult().then(result => {
  if(result.isEmpty()) { /* proceed */ }
  result.throw();
});
```

Response patterns: `res.send(data)`, `res.send('success')`, `res.status(403).end()`

### AngularJS Frontend

Dependency injection array syntax:
```javascript
app.controller('AdminController', ['$scope', '$http', '$state',
  ($scope, $http, $state) => { /* logic */ }
]);
```

## Architecture

### Key Directories
- `/init`: App initialization (knex, redis, logging, plugins)
- `/services`: Core services (config, manager, server, shadowsocks)
- `/plugins`: Plugin modules (webgui, account, flowSaver, etc.)
- `/models`: Database models
- `/config`: Configuration files

### Plugin Structure
```
plugins/pluginName/
  index.js      # Main entry
  dependence.js # Dependencies array
  db/           # Database migrations
  server/       # Express routes (webgui)
  public/       # Frontend assets (webgui)
```

### WebGUI Structure
```
plugins/webgui/
  server/         # API routes (admin.js, user.js)
  public/
    controllers/  # AngularJS controllers
    views/        # HTML templates
    dialogs/      # Dialog components
```

## Common Patterns

1. Use `appRequire()` for internal modules
2. Parse JSON from DB: `JSON.parse(account.data)`
3. Super admin check: `req.adminInfo.id === 1`
4. User auth: `req.session.user`
5. Account type time constants:
   - Type 2: Weekly (7 * 24 * 3600000 ms)
   - Type 3: Monthly (30 * 24 * 3600000 ms)
   - Type 4: Daily (24 * 3600000 ms)
   - Type 5: Hourly (3600000 ms)

## Logging

```javascript
const log4js = require('log4js');
const logger = log4js.getLogger('system');
logger.info('message');
logger.error('error message');
```

## Dependencies

- Node.js 12+
- Redis (caching/sessions)
- Shadowsocks server with management API
- SQLite (default) or MySQL
