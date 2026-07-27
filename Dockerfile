# Use the official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install production dependencies only
RUN npm install --omit=dev --no-audit --no-fund --loglevel=error

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "src/app.js"]
