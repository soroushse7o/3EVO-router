FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .
RUN npm run build
RUN adduser -D appuser
USER appuser
EXPOSE 20128
ENV DATA_DIR=/home/appuser/.3evo
CMD ["npm", "run", "start"]
