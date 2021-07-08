FROM nginx:mainline-alpine

COPY ./nginx /usr/share/nginx/html/

EXPOSE 80