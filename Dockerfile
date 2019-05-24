FROM node:10.15.3-slim
RUN  apt-get update \
     && apt-get install -y wget --no-install-recommends \
     && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
     && apt-get update \
     && apt-get install -y google-chrome-unstable --no-install-recommends \
     && rm -rf /var/lib/apt/lists/* \
     && wget --quiet https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -O /usr/sbin/wait-for-it.sh \
     && chmod +x /usr/sbin/wait-for-it.sh

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN mkdir /3loa
COPY index.js /3loa/index.js
COPY package.json /3loa/package.json
COPY package-lock.json /3loa/package-lock.json
WORKDIR /3loa
RUN npm install
CMD ["node","index.js"]
