#!/bin/bash
# diagnostics.sh - gather Docker deployment diagnostics for SkillSwap backend
OUTFILE=diagnostics-output.txt
rm -f "$OUTFILE"
exec > "$OUTFILE" 2>&1

echo "== date =="
date

echo "\n== uname -a =="
uname -a

echo "\n== docker-compose ps =="
docker-compose ps

echo "\n== docker ps --no-trunc =="
docker ps --no-trunc

echo "\n== docker-compose logs backend (last 200 lines) =="
docker-compose logs backend --tail 200 || echo "(no docker-compose logs for backend)"

echo "\n== docker inspect backend container(s) =="
CONTAINERS=$(docker-compose ps -q backend 2>/dev/null)
if [ -z "$CONTAINERS" ]; then
  echo "No container id returned by docker-compose ps -q backend"
else
  for c in $CONTAINERS; do
    docker inspect "$c"
  done
fi

echo "\n== ss/listening ports (requires sudo) =="
sudo ss -lntp | sed -n '1,200p' || echo "ss failed or sudo required"

echo "\n== cat docker-compose.yml =="
cat docker-compose.yml || echo "docker-compose.yml not found"

echo "\n== cat .env (redact secrets before sharing) =="
if [ -f .env ]; then
  sed -n '1,200p' .env
else
  echo ".env not found"
fi

echo "\n== tail -n 300 /var/log/syslog (last 300 lines) =="
if [ -f /var/log/syslog ]; then
  tail -n 300 /var/log/syslog
else
  echo "/var/log/syslog not present on this system"
fi

echo "\n== End of diagnostics =="

echo "Diagnostics gathered to $OUTFILE"

# Print brief instruction
cat <<'EOF'

Next steps:
1) Run: bash diagnostics.sh
2) Upload the generated diagnostics-output.txt file or paste its contents here (remove any secrets)

I will analyze and provide exact fixes.
EOF
