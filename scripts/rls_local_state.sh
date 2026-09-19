#!/usr/bin/env bash
#
# rls_local_state.sh — build a throwaway database from supabase/migrations/,
# dump its security state with supabase/dump_prod_state.sql, and (optionally)
# diff it against the same dump taken from production.
#
# The point: supabase/migrations/01-10 do not describe production. Comparing
# them by eye is hopeless. This produces a mechanical diff instead.
#
# Nothing here ever touches a remote database. It only builds local throwaways.
#
# Usage
#   scripts/rls_local_state.sh [options]
#
#   --mode cli|docker   How to get a Postgres. Default: cli if the Supabase CLI
#                       and Docker are both available, otherwise docker.
#                         cli    - the real Supabase local stack. Reproduces
#                                  Supabase's roles, schema ACLs and default
#                                  privileges, so grants are comparable.
#                         docker - plain postgres:17 plus scripts/supabase_shim.sql.
#                                  Fast and dependency-light, but the shim only
#                                  approximates Supabase's roles and grants, so
#                                  dump sections 01-04 are NOT comparable.
#   --through N         Apply migrations 01..N only (default: all of them).
#                       `--through 09` shows what the committed migrations
#                       looked like before 10_performance.sql rewrote them.
#   --out FILE          Where to write the dump.
#                       Default: supabase/.rls-state/local_state[_NN].txt
#   --diff FILE         Diff the result against FILE (your prod dump) and exit
#                       non-zero if they differ.
#   --verify            After dumping, run supabase/verify_isolation.sql: it
#                       seeds two families, attacks the policies as the
#                       `authenticated` role, and reports PASS/FAIL per check.
#                       Exits non-zero on any failure. This is the check that
#                       actually proves family isolation; the dump only
#                       describes it.
#   --keep              Leave the database running afterwards and print how to
#                       connect to it, for poking at policies by hand.
#   -h, --help          This text.
#
# Examples
#   # prove the policy set isolates families
#   scripts/rls_local_state.sh --verify
#
#   # full local dump, then compare with production
#   scripts/rls_local_state.sh --diff prod_state.txt
#
#   # what did 01-09 alone produce?
#   scripts/rls_local_state.sh --through 09
#
#   # the state before 11_rls_hardening.sql: 11 checks fail
#   scripts/rls_local_state.sh --through 10 --verify
#
#   # keep it alive to test a policy interactively
#   scripts/rls_local_state.sh --keep

set -euo pipefail

readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly MIGRATIONS_DIR="$REPO_ROOT/supabase/migrations"
readonly DUMP_SQL="$REPO_ROOT/supabase/dump_prod_state.sql"
readonly SHIM_SQL="$REPO_ROOT/scripts/supabase_shim.sql"
readonly VERIFY_SQL="$REPO_ROOT/supabase/verify_isolation.sql"
readonly STATE_DIR="$REPO_ROOT/supabase/.rls-state"

readonly PG_IMAGE="postgres:17-alpine"
readonly DOCKER_CONTAINER="family-pulse-rls-diff"
# Assigned at runtime. Hardcoding a port collides with whatever else the
# machine happens to be running — this repo's author has several Supabase
# stacks and an SSH tunnel up at any given moment.
DOCKER_PORT=""

MODE=""
THROUGH=""
OUT_FILE=""
DIFF_AGAINST=""
KEEP="no"
VERIFY="no"

# Set once a database exists, so cleanup knows what to tear down.
CLEANUP_KIND=""
CLEANUP_DIR=""

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
say() { printf '\033[1m==>\033[0m %s\n' "$*" >&2; }

# The header comment above is the help text. Printed from line 3 up to the
# first line that is not a comment, so the two never drift apart.
usage() {
  awk 'NR > 2 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --mode)     MODE="${2:-}";          shift 2 ;;
      --through)  THROUGH="${2:-}";       shift 2 ;;
      --out)      OUT_FILE="${2:-}";      shift 2 ;;
      --diff)     DIFF_AGAINST="${2:-}";  shift 2 ;;
      --verify)   VERIFY="yes";           shift ;;
      --keep)     KEEP="yes";             shift ;;
      -h|--help)  usage; exit 0 ;;
      *)          die "unknown option: $1 (try --help)" ;;
    esac
  done

  [ -n "$MODE" ] || MODE="$(pick_mode)"
  case "$MODE" in cli|docker) ;; *) die "--mode must be cli or docker" ;; esac

  if [ -n "$THROUGH" ] && ! printf '%s' "$THROUGH" | grep -Eq '^[0-9]{1,2}$'; then
    die "--through takes a migration number, e.g. --through 09"
  fi

  if [ -z "$OUT_FILE" ]; then
    local suffix=""
    [ -n "$THROUGH" ] && suffix="_$(printf '%02d' "$((10#$THROUGH))")"
    OUT_FILE="$STATE_DIR/local_state${suffix}.txt"
  fi
}

pick_mode() {
  if have supabase && have docker && docker info >/dev/null 2>&1; then
    echo cli
  else
    echo docker
  fi
}

have() { command -v "$1" >/dev/null 2>&1; }

# First free TCP port at or above $1, probed with bash's own /dev/tcp so this
# needs no nc/lsof/python. Needed because the Supabase CLI hardcodes
# 54321-54329 in a fresh config.toml, and a developer with another local stack
# already running would otherwise get an opaque bind failure.
find_free_port() {
  local base="$1" p
  for p in $(seq "$base" "$((base + 300))"); do
    if ! (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then
      printf '%s\n' "$p"
      return 0
    fi
    exec 3>&- 2>/dev/null || true
  done
  die "no free TCP port found in $base..$((base + 300))"
}

preflight() {
  have psql   || die "psql not found. brew install libpq (then add it to PATH) or brew install postgresql@17"
  have docker || die "docker not found. Both modes need it; the Supabase CLI runs Postgres in Docker too."
  docker info >/dev/null 2>&1 || die "Docker is installed but not running. Start Docker Desktop and retry."
  [ -f "$DUMP_SQL" ] || die "missing $DUMP_SQL"
  [ -d "$MIGRATIONS_DIR" ] || die "missing $MIGRATIONS_DIR"
  if [ "$VERIFY" = "yes" ]; then
    [ -f "$VERIFY_SQL" ] || die "missing $VERIFY_SQL (needed by --verify)"
  fi

  if [ "$MODE" = "cli" ]; then
    have supabase || die "--mode cli needs the Supabase CLI. brew install supabase/tap/supabase, or use --mode docker."
  else
    [ -f "$SHIM_SQL" ] || die "missing $SHIM_SQL (needed by --mode docker)"
  fi
}

# Migrations to apply, in numeric order, honouring --through.
#
# Prefixes may carry a letter suffix (11a, 11b) for migrations that must be
# split across deploys. The letter orders them within the number — plain `sort`
# already does that correctly, since "11a" < "11b" — and is dropped for the
# --through comparison, so `--through 11` means "all of 11".
#
# An unparseable .sql file is a hard error, not a skip. The earlier version
# skipped silently, and when 11_rls_hardening.sql was split into 11a/11b it
# quietly applied neither: the isolation suite then reported the unfixed
# database as though the fix had been tested. A harness that ignores a
# migration is worse than one that refuses to run.
migration_files() {
  local f base num digits
  for f in "$MIGRATIONS_DIR"/*.sql; do
    base="$(basename "$f")"
    num="${base%%_*}"
    digits="${num%%[!0-9]*}"

    if [ -z "$digits" ] || ! printf '%s' "$num" | grep -Eq '^[0-9]+[a-z]?$'; then
      die "cannot order migration '$base': expected a NN_ or NNx_ prefix"
    fi

    if [ -n "$THROUGH" ] && [ "$((10#$digits))" -gt "$((10#$THROUGH))" ]; then
      continue
    fi
    printf '%s\n' "$f"
  done | sort
}

cleanup() {
  local status=$?
  if [ "$KEEP" = "yes" ] && [ -n "$CLEANUP_KIND" ]; then
    say "left running (--keep). Tear it down with:"
    case "$CLEANUP_KIND" in
      cli)    printf '      supabase stop --no-backup --workdir %s && rm -rf %s\n' \
                "$CLEANUP_DIR" "$CLEANUP_DIR" >&2 ;;
      docker) printf '      docker rm -f %s\n' "$DOCKER_CONTAINER" >&2 ;;
    esac
    return $status
  fi

  case "$CLEANUP_KIND" in
    cli)
      say "stopping the Supabase local stack"
      (cd "$CLEANUP_DIR" && supabase stop --no-backup >/dev/null 2>&1) || true
      ;;
    docker)
      say "removing the throwaway Postgres container"
      docker rm -f "$DOCKER_CONTAINER" >/dev/null 2>&1 || true
      ;;
  esac
  [ -n "$CLEANUP_DIR" ] && rm -rf "$CLEANUP_DIR"
  return $status
}

# Rewrite every `port = 543xx` in a freshly-initialised config.toml to a free
# port, and echo whichever one the database ended up on. Order is preserved, so
# the database's port is the replacement for 54322.
relocate_config_ports() {
  local config="$1" default next db_port=""
  local base=54600

  for default in 54321 54322 54323 54324 54327 54329; do
    grep -q "^port = $default\$" "$config" || continue
    next="$(find_free_port "$base")"
    base=$((next + 1))
    sed -i '' "s/^port = $default\$/port = $next/" "$config"
    [ "$default" = "54322" ] && db_port="$next"
  done

  [ -n "$db_port" ] || die "could not find the database port in $config"
  printf '%s\n' "$db_port"
}

# --- mode: cli -------------------------------------------------------------
#
# `supabase init` + `supabase start` in a temp directory OUTSIDE the repo, so
# the repo never gains a config.toml or a linked project ref as a side effect.
#
# The migrations are applied with psql rather than `supabase db reset`, because
# the CLI expects migration filenames to start with a timestamp and these are
# numbered 01..10. psql also gives exact control over the order, which matters:
# 10_performance.sql is written to run after 01-09.
start_cli_db() {
  local workdir; workdir="$(mktemp -d)"
  CLEANUP_KIND="cli"
  CLEANUP_DIR="$workdir"

  supabase init --force --workdir "$workdir" >/dev/null \
    || die "supabase init failed"

  # A fresh config.toml hardcodes 54321-54329, so a developer with another
  # local stack already up gets an opaque "port is already allocated" failure.
  # EVERY port in the file is relocated, not just the database's: which
  # containers actually start depends on the CLI version (the -x names below
  # changed between 2.10x and 2.11x), so any of these ports may end up being
  # bound. Each default value is unique in the file, so replacing by value is
  # unambiguous.
  local p_db; p_db="$(relocate_config_ports "$workdir/supabase/config.toml")"

  say "starting the Supabase local stack on db port $p_db"
  say "(first run pulls the Postgres image; be patient)"

  # Only Postgres is needed: every check here speaks SQL and sets its own role
  # and JWT claims, which is a stricter test than going through PostgREST.
  # The exclusion list is the UNION of the names used by different CLI
  # versions — an unrecognised name is only a warning, so a superset is the
  # portable choice.
  supabase start --workdir "$workdir" --ignore-health-check -x \
studio,realtime,imgproxy,edge-runtime,vector,kong,logflare,supavisor,\
storage,storage-api,inbucket,mailpit,functions,analytics,rest,postgrest,\
meta,postgres-meta,gotrue \
    >/dev/null 2>&1 \
    || die "supabase start failed. Re-run with --mode docker, or check 'docker ps' for a stale stack."

  # The CLI's local credentials are fixed and published in Supabase's own docs.
  # They are not secret and reach nothing outside this machine.
  printf 'postgresql://postgres:postgres@127.0.0.1:%s/postgres\n' "$p_db"
}

# --- mode: docker ----------------------------------------------------------
#
# Let Docker pick the host port (`-p 127.0.0.1::5432`) and read it back, rather
# than guessing one. Guessing produces a "port is already allocated" failure
# that surfaces 60 seconds later as a misleading readiness timeout.
start_docker_db() {
  CLEANUP_KIND="docker"

  docker rm -f "$DOCKER_CONTAINER" >/dev/null 2>&1 || true

  say "starting $PG_IMAGE (first run pulls the image)"
  docker run -d \
    --name "$DOCKER_CONTAINER" \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=postgres \
    -p "127.0.0.1::5432" \
    "$PG_IMAGE" >/dev/null \
    || die "docker run failed (see the error above)"

  DOCKER_PORT="$(
    docker port "$DOCKER_CONTAINER" 5432/tcp 2>/dev/null | head -1 | sed 's/.*://'
  )"
  [ -n "$DOCKER_PORT" ] || die "could not determine the container's published port"

  # Fixed, local-only, throwaway credentials for a container that is destroyed
  # at the end of this script. Nothing here is a secret and nothing outside
  # this machine can reach it.
  local url="postgresql://postgres:postgres@127.0.0.1:$DOCKER_PORT/postgres"
  say "postgres listening on 127.0.0.1:$DOCKER_PORT"

  local i
  for i in $(seq 1 60); do
    if psql "$url" --no-psqlrc -qtAc 'select 1' >/dev/null 2>&1; then
      say "applying the Supabase shim (roles, auth schema, auth.uid())"
      run_sql "$url" "$SHIM_SQL"
      echo "$url"
      return 0
    fi
    # A container that exited is never going to become ready; say so now
    # instead of after a minute of polling.
    if [ "$(docker inspect -f '{{.State.Running}}' "$DOCKER_CONTAINER" 2>/dev/null)" != "true" ]; then
      docker logs "$DOCKER_CONTAINER" 2>&1 | tail -20 >&2
      die "the Postgres container exited; its last log lines are above"
    fi
    sleep 1
  done
  die "Postgres did not become ready within 60s"
}

run_sql() {
  local url="$1" file="$2"
  psql "$url" --no-psqlrc --quiet -v ON_ERROR_STOP=1 -f "$file" >/dev/null
}

apply_migrations() {
  local url="$1" f base
  while IFS= read -r f; do
    base="$(basename "$f")"
    say "applying $base"
    # 01 and 02 use bare CREATE TABLE, and 10 wraps itself in BEGIN/COMMIT.
    # ON_ERROR_STOP makes a failure loud instead of leaving a half-built
    # database that then produces a meaningless diff.
    if ! run_sql "$url" "$f"; then
      die "$base failed to apply. That is a finding — record it and stop."
    fi
  done < <(migration_files)
}

take_dump() {
  local url="$1" out="$2"
  mkdir -p "$(dirname "$out")"
  say "dumping state to $out"
  psql "$url" \
    --no-psqlrc --tuples-only --no-align --quiet \
    -v ON_ERROR_STOP=1 \
    -f "$DUMP_SQL" > "$out"
  say "$(wc -l < "$out" | tr -d ' ') lines captured"
}

# The dump describes the policy set; this proves what it does. Runs entirely
# inside one transaction that ends in ROLLBACK, so the database is unchanged
# afterwards and --keep still leaves a clean one behind.
run_verify() {
  local url="$1"

  printf '\n' >&2
  say "running the isolation suite as the 'authenticated' role"

  local out
  out="$(psql "$url" --no-psqlrc --quiet -v ON_ERROR_STOP=1 -f "$VERIFY_SQL" 2>&1)" || {
    printf '%s\n' "$out" >&2
    die "the isolation suite could not run to completion (output above)"
  }
  printf '%s\n' "$out"

  # The suite reports its own verdict rather than failing loudly, so the exit
  # status has to come from reading it back.
  if printf '%s' "$out" | grep -q 'ALL CHECKS PASSED'; then
    say "isolation verified"
    return 0
  fi
  printf '\n' >&2
  say "ISOLATION CHECKS FAILED. Every pass=f row above is a live hole."
  say "See supabase/RLS_RECONCILIATION.md sections 3 and 4."
  return 1
}

report_diff() {
  local prod="$1" local_file="$2"
  [ -f "$prod" ] || die "--diff file not found: $prod"

  printf '\n' >&2
  say "diff: $prod (prod) vs $local_file (migrations 01-${THROUGH:-10})"
  printf '    < = only in prod   > = only in the migrations\n\n' >&2

  if diff -u "$prod" "$local_file"; then
    say "IDENTICAL. The committed migrations reproduce production exactly."
    return 0
  fi

  printf '\n' >&2
  say "they differ. Every line above is drift the repo does not record."
  say "Start with '11 policy' and '05 table-rls'; see supabase/RLS_RECONCILIATION.md."
  return 1
}

main() {
  parse_args "$@"
  preflight
  trap cleanup EXIT

  say "mode: $MODE"
  if [ "$MODE" = "docker" ]; then
    say "NOTE: shim mode. Dump sections 01-04 (roles, schema ACLs, default"
    say "      privileges) are approximations and will differ from prod."
  fi

  local url
  if [ "$MODE" = "cli" ]; then
    url="$(start_cli_db)"
  else
    url="$(start_docker_db)"
  fi

  apply_migrations "$url"
  take_dump "$url" "$OUT_FILE"

  if [ "$KEEP" = "yes" ]; then
    say "database left up at: $url"
  fi

  # Both are run when both are asked for, and the exit status reflects either
  # failing — a clean diff against a production that is itself insecure is not
  # a pass, and neither is a hardened local database that does not match prod.
  local failed=0
  [ "$VERIFY" = "yes" ] && { run_verify "$url" || failed=1; }

  if [ -n "$DIFF_AGAINST" ]; then
    report_diff "$DIFF_AGAINST" "$OUT_FILE" || failed=1
  elif [ "$VERIFY" != "yes" ]; then
    printf '\n' >&2
    say "next: take the prod dump (see supabase/RLS_RECONCILIATION.md), then"
    printf '      diff -u prod_state.txt %s\n' "$OUT_FILE" >&2
  fi

  return $failed
}

main "$@"
