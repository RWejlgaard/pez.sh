FROM nginx:1-alpine

COPY ./nginx /usr/share/nginx/html/

EXPOSE 80