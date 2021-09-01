FROM nginx:1.20-alpine

COPY ./nginx /usr/share/nginx/html/

EXPOSE 80