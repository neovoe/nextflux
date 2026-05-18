# Stage 1: Build the React application
# Specify the version to ensure consistent builds
FROM node:20-bookworm-slim AS build

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package.json package-lock.json ./

# Install dependencies using npm
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Run the server using Caddy
# Specify the version for consistency
FROM caddy:2-alpine

# Copy built assets from the builder stage
COPY --from=build /app/dist /srv

# Caddy will pick up the Caddyfile automatically
COPY Caddyfile /etc/caddy/Caddyfile

# Expose the port Caddy listens on
EXPOSE 3000

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]