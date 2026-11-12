#!/bin/sh
# Dedicated mock-only Jenkins demo. Does not touch petory-instructor or its data.
set -eu
cd "$(dirname "$0")/.."
name=petory-jenkins-instructor
image=petory-jenkins-instructor:latest
revision=$(git rev-parse HEAD)
remote_main=$(git ls-remote origin refs/heads/main | awk '{print $1}')
if [ -z "$remote_main" ] || [ "$revision" != "$remote_main" ]; then
  echo 'Refusing deployment: checked-out commit is not the current origin/main.' >&2
  exit 1
fi
case "${BUILD_NUMBER:-}" in ''|*[!0-9]*) echo 'A Jenkins BUILD_NUMBER is required.' >&2; exit 1 ;; esac

previous="${name}-previous-${BUILD_NUMBER}"
failed="${name}-failed-${BUILD_NUMBER}"
if docker container inspect "$previous" >/dev/null 2>&1 || docker container inspect "$failed" >/dev/null 2>&1; then
  echo 'A container with this build number already exists; refusing to overwrite it.' >&2
  exit 1
fi

for volume in petory-jenkins-docker-data petory-jenkins-demo-state; do
  if docker volume inspect "$volume" >/dev/null 2>&1; then
    owner=$(docker volume inspect --format '{{ index .Labels "org.petory.owner" }}' "$volume")
    if [ "$owner" != jenkins-demo ]; then echo "Volume $volume is not owned by this demo; refusing to use it." >&2; exit 1; fi
  else
    docker volume create --label org.petory.owner=jenkins-demo "$volume" >/dev/null
  fi
done

had_previous=0
if docker container inspect "$name" >/dev/null 2>&1; then
  owner=$(docker container inspect --format '{{ index .Config.Labels "org.petory.owner" }}' "$name")
  if [ "$owner" != jenkins-demo ]; then echo 'Container name belongs to another workload; refusing to change it.' >&2; exit 1; fi
  had_previous=1
  docker stop "$name" >/dev/null
  docker rename "$name" "$previous"
fi

rollback() {
  echo 'Deployment failed. Retaining the failed container and persistent volumes.' >&2
  if docker container inspect "$name" >/dev/null 2>&1; then
    docker stop "$name" >/dev/null 2>&1 || true
    docker rename "$name" "$failed" || true
  fi
  if [ "$had_previous" -eq 1 ]; then
    docker rename "$previous" "$name" && docker start "$name" >/dev/null || true
    echo 'Previous container restarted where possible; verify demo status manually.' >&2
  fi
}
trap rollback EXIT

docker run -d --name "$name" --platform linux/amd64 --privileged \
  --label org.petory.owner=jenkins-demo \
  -v petory-jenkins-docker-data:/var/lib/docker \
  -v petory-jenkins-demo-state:/var/lib/petory-jenkins-state \
  "$image" >/dev/null

ready=0
for attempt in $(seq 1 90); do
  if docker exec "$name" docker info >/dev/null 2>&1; then ready=1; break; fi
  sleep 2
done
if [ "$ready" -ne 1 ]; then echo 'Instructor Docker daemon did not become ready.' >&2; exit 1; fi
docker exec -e DOCKER_BUILDKIT=0 \
  -e PETORY_DEMO_STATE_PATH=/var/lib/petory-jenkins-state/demo-state.json \
  "$name" sh -c 'cd /workspace/petory && npm run demo:start'
trap - EXIT
echo "Deployed revision $revision. See READY above for the current temporary URL."
