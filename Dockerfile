FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN adduser -D appuser
USER appuser
EXPOSE 20128
ENV DATA_DIR=/home/appuser/.3evo
CMD ["npm", "run", "start"]
