# ---- dev ----
FROM node:14.15.3 AS dev
WORKDIR /app

COPY ./package.json ./
COPY ./yarn.lock ./
COPY ./tsconfig.json ./

RUN yarn install

COPY ./public/ ./public/
COPY ./src/ ./src/

EXPOSE 3000

CMD ["yarn", "start"]


# ---- build ----
FROM dev AS build

RUN yarn build


# --- release ----
FROM nginx:alpine AS release
# WORKDIR /app

# COPY --from=build /app/package.json ./
# COPY --from=build /app/yarn.lock ./

# RUN yarn install --production
COPY --from=build /app/build/ /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
