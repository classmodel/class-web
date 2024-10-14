# From https://pnpm.io/docker#example-1-build-a-bundle-in-a-docker-container
# Build with
# docker build -t class -f packages/class/Dockerfile .
# Run with
# docker run --rm -v $PWD:$PWD class $PWD/config.json
FROM node:22-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Create a non-root user and switch to it
RUN useradd --create-home --shell /bin/bash appuser
USER appuser
WORKDIR /app/packages/class/src
ENTRYPOINT ["node", "--experimental-strip-types", "--experimental-default-type=module", "cli.ts"]
