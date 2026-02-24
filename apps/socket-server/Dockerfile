FROM node:22-bookworm

# Install Python and build-essential (C++ compiler) required by Mediasoup
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory to the root of the monorepo inside the container
WORKDIR /app

# The command will be overridden by docker-compose, but this is a safe default
CMD ["pnpm", "run", "dev", "--filter", "socket-server"]