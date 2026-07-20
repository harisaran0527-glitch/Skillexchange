FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Bundle app source
COPY . .

# Build steps if needed (none)

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
