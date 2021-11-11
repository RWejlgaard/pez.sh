FROM nginx:1.21.4-alpine

COPY ./nginx /usr/share/nginx/html/

EXPOSE 80