FROM node:22-alpine AS build
ARG VITE_API_URL
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

COPY src/ src/
COPY public/ public/
COPY index.html vite.config.js ./

RUN VITE_API_URL=${VITE_API_URL} npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
