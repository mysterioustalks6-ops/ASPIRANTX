const fs = require('fs');
const ts = require('typescript');

const setters = [
  'watchdogSystemLogs',
  'simulatedErrors',
  'globalAdminSettings',
  'lastGatewaySettingsSync',
  'adminTeamStore',
  'featureFlagsStore',
  'adminUsersDb',
  'adminContentDb',
  'adminTasksStore'
];

const setterDefinitions = `
export function setWatchdogSystemLogs(val: any) {
  if (typeof val === 'function') {
    watchdogSystemLogs = val(watchdogSystemLogs);
  } else {
    watchdogSystemLogs = val;
  }
}

export function setSimulatedErrors(val: any) {
  simulatedErrors = val;
}

export function setGlobalAdminSettings(val: any) {
  if (typeof val === 'function') {
    globalAdminSettings = val(globalAdminSettings);
  } else {
    globalAdminSettings = val;
  }
}

export function setLastGatewaySettingsSync(val: number) {
  lastGatewaySettingsSync = val;
}

export function setAdminUsersDb(val: any) {
  if (typeof val === 'function') {
    adminUsersDb = val(adminUsersDb);
  } else {
    adminUsersDb = val;
  }
}

export function setAdminContentDb(val: any) {
  adminContentDb = val;
}

export function setFeatureFlagsStore(val: any) {
  if (typeof val === 'function') {
    featureFlagsStore = val(featureFlagsStore);
  } else {
    featureFlagsStore = val;
  }
}

export function setAdminTeamStore(val: any) {
  if (typeof val === 'function') {
    adminTeamStore = val(adminTeamStore);
  } else {
    adminTeamStore = val;
  }
}

export function setAdminTasksStore(val: any) {
  if (typeof val === 'function') {
    adminTasksStore = val(adminTasksStore);
  } else {
    adminTasksStore = val;
  }
}
`;

// 1. Update routes/shared.ts
let sharedContent = fs.readFileSync('routes/shared.ts', 'utf8');
if (!sharedContent.includes('export function setWatchdogSystemLogs')) {
  sharedContent += '\n' + setterDefinitions;
  fs.writeFileSync('routes/shared.ts', sharedContent, 'utf8');
  console.log('Added setters to routes/shared.ts');
}

const setterFunctionNames = setters.map(v => 'set' + v.charAt(0).toUpperCase() + v.slice(1));

function transformFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Make sure setters are in imports
  setterFunctionNames.forEach(fn => {
    if (!code.includes(fn)) {
      code = code.replace("from './shared.js';", `  ${fn},\n} from './shared.js';`);
    }
  });

  const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);
  const edits = [];

  function visit(node) {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      let varName = null;
      if (ts.isIdentifier(node.left)) {
        varName = node.left.text;
      } else if (ts.isPropertyAccessExpression(node.left)) {
        varName = node.left.name.text;
      }

      if (varName && setters.includes(varName)) {
        const setterName = 'set' + varName.charAt(0).toUpperCase() + varName.slice(1);
        const rightText = node.right.getText(sourceFile);
        edits.push({
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          replacement: setterName + '(' + rightText + ')'
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  edits.sort((a, b) => b.start - a.start);
  let res = code;
  for (const edit of edits) {
    res = res.slice(0, edit.start) + edit.replacement + res.slice(edit.end);
  }

  fs.writeFileSync(filePath, res, 'utf8');
  console.log('Transformed', filePath, 'with', edits.length, 'edits');
}

const routeFiles = [
  'routes/academic.routes.ts',
  'routes/community.routes.ts',
  'routes/admin.routes.ts',
  'routes/user.routes.ts',
  'routes/teacher.routes.ts',
  'routes/ai.routes.ts'
];

routeFiles.forEach(f => transformFile(f));
