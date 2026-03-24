FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN mkdir -p db
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
