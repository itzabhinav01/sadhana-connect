#!/usr/bin/env node
// Guided first-time setup for a self-hosted Sadhana Connect instance.
//
// Runs entirely on the person's own machine, against their own Supabase
// project — nothing here is sent anywhere else, and nothing about one
// group's deployment is ever visible to another group or to whoever wrote
// this script. It only wraps the same `supabase` CLI commands documented
// in README.md, so it can be safely skipped in favor of running those by
// hand (see README.md's "Manual setup" appendix).
//
// Usage: npm run setup

import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { spawnSync } from 'node:child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rl = createInterface({ input: stdin, output: stdout })

function log(message) {
  console.log(message)
}

async function ask(question, { required = true } = {}) {
  while (true) {
    const answer = (await rl.question(question)).trim()
    if (answer || !required) return answer
    log('  This one is required — please enter a value.')
  }
}

async function askYesNo(question) {
  const answer = (await ask(`${question} (y/N): `, { required: false })).toLowerCase()
  return answer === 'y' || answer === 'yes'
}

// Runs a supabase CLI command, streaming its output live. Exits the whole
// script on failure rather than pressing on with a half-configured
// project — every later step depends on earlier ones having succeeded.
function run(description, args) {
  log(`\n→ ${description}...`)
  const result = spawnSync('npx', ['supabase', ...args], {
    stdio: 'inherit',
    shell: true,
    cwd: rootDir,
  })
  if (result.status !== 0) {
    log(`\n✗ Failed: ${description}`)
    log('  You can re-run this script once you\'ve fixed the issue above —')
    log('  it\'s safe to run again from the start.')
    rl.close()
    process.exit(1)
  }
  log(`✓ ${description}`)
}

async function main() {
  log('Sadhana Connect — guided setup\n')
  log('This sets up YOUR OWN independent instance: your own Supabase project,')
  log('your own database, your own admin account. Nothing here is shared with')
  log('anyone else\'s deployment, including the original author\'s.\n')
  log('Before continuing, have ready (from your Supabase project\'s dashboard,')
  log('under Project Settings → API):')
  log('  - your project ref (the short id in the dashboard URL)')
  log('  - your Project URL')
  log('  - your anon/publishable key')
  log('  - your secret API key (labelled "secret", NOT "anon"/"publishable")\n')

  const projectRef = await ask('Supabase project ref: ')
  const supabaseUrl = await ask('Supabase Project URL (e.g. https://xxxx.supabase.co): ')
  const anonKey = await ask('Supabase anon/publishable key: ')
  const secretKey = await ask('Supabase secret API key: ')

  log('\nYour app\'s URL is used for password-reset links and admin-action security.')
  log('If you haven\'t deployed to Vercel yet, leave this blank for now — you can')
  log('re-run this script\'s last step later with the real URL.')
  let appUrl = await ask('Your deployed app URL (blank = http://localhost:5173): ', {
    required: false,
  })
  appUrl = appUrl.replace(/\/+$/, '') || 'http://localhost:5173'

  // --- Web .env -------------------------------------------------------
  writeFileSync(
    path.join(rootDir, '.env'),
    `VITE_SUPABASE_URL=${supabaseUrl}\nVITE_SUPABASE_PUBLISHABLE_KEY=${anonKey}\n`,
  )
  log('\n✓ wrote .env')

  if (await askYesNo('Set up the mobile app\'s .env too?')) {
    const mobileDir = path.join(rootDir, 'apps/mobile')
    if (existsSync(mobileDir)) {
      writeFileSync(
        path.join(mobileDir, '.env'),
        `EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}\nEXPO_PUBLIC_SUPABASE_ANON_KEY=${anonKey}\n`,
      )
      log('✓ wrote apps/mobile/.env')
    }
  }

  // --- Supabase CLI: link, migrate, auth config ------------------------
  run('Logging into the Supabase CLI (a browser window will open)', ['login'])
  run('Linking to your Supabase project', ['link', '--project-ref', projectRef, '--yes'])
  run('Applying database migrations', ['db', 'push', '--yes'])

  const configPath = path.join(rootDir, 'supabase/config.toml')
  let config = readFileSync(configPath, 'utf8')
  config = config.replace(/^site_url = ".*"$/m, `site_url = "${appUrl}"`)
  config = config.replace(
    /^additional_redirect_urls = \[.*\]$/m,
    `additional_redirect_urls = ["${appUrl}", "${appUrl}/reset-password", "http://localhost:5173/**"]`,
  )
  writeFileSync(configPath, config)
  run('Pushing Auth URL configuration to your project', ['config', 'push', '--yes'])

  // --- Admin Edge Function ---------------------------------------------
  run('Deploying the admin Edge Function', ['functions', 'deploy', 'admin-account-actions', '--yes'])
  run('Setting SERVICE_ROLE_SECRET_KEY', ['secrets', 'set', `SERVICE_ROLE_SECRET_KEY=${secretKey}`])
  run('Setting APP_ORIGIN', ['secrets', 'set', `APP_ORIGIN=${appUrl}`])
  run('Setting ALLOWED_ORIGINS', ['secrets', 'set', `ALLOWED_ORIGINS=${appUrl}`])

  log('\nBackend is fully configured.')
  log('Next: run "npm run dev" (or deploy to Vercel), then register your own')
  log('account in the app — you\'ll come in as an ordinary devotee at first.')

  // --- Bootstrap the first Super Admin ---------------------------------
  if (await askYesNo('\nHave you already registered your own account in the running app?')) {
    const email = await ask('The email you registered with: ')
    const escapedEmail = email.replace(/'/g, "''")
    const sql = `update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = '${escapedEmail}');`
    run('Promoting your account to Super Admin', ['db', 'query', '--linked', sql])
    log('\n✓ Refresh the app — you now have the Super Admin panel.')
  } else {
    log('\nOnce you\'ve registered your account, promote yourself to Super Admin with:')
    log(
      '  npx supabase db query --linked "update public.profiles set role = \'super_admin\' where id = (select id from auth.users where email = \'YOUR_EMAIL\');"',
    )
  }

  if (appUrl === 'http://localhost:5173') {
    log('\nWhen you deploy to Vercel and get your real URL, re-run this script')
    log('(or see README.md\'s "Manual setup" appendix) so APP_ORIGIN/ALLOWED_ORIGINS')
    log('and the Auth redirect URLs match your real deployed address.')
  }

  log('\nDone.')
  rl.close()
}

main().catch((error) => {
  log(`\n✗ Setup failed unexpectedly: ${error.message}`)
  rl.close()
  process.exit(1)
})
