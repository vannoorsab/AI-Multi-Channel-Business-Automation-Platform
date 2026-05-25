# Use official Node.js runtime as parent image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy remaining source code
COPY . .

# Expose internal listening port
EXPOSE 5000

# Start server node application
CMD ["npm", "start"]
