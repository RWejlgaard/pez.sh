FROM ruby:latest AS build
COPY ./src/. /app
WORKDIR /app
RUN bundle install && jekyll build

FROM nginx:latest AS final
COPY --from=build /app/_site /usr/share/nginx/html
