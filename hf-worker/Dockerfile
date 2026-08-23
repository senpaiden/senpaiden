FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libvips-dev && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 7860
CMD ["npm", "start"]
