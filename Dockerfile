FROM nginx:stable-alpine

COPY ./nginx /usr/share/nginx/html/

EXPOSE 80