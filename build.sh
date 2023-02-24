echo "Building $DATASYN_DOCKER_IMAGE"
echo "$BUILDER_REGISTRY_PASSWORD_A" | docker login -u "$BUILDER_REGISTRY_USER_A" --password-stdin "$REGISTRY_HOSTNAME_A"
docker-compose build
docker-compose push | tee output.txt
