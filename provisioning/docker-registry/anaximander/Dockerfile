FROM dockerfile/nodejs

RUN apt-get install -y python build-essential

RUN mkdir -p /anax

WORKDIR /anax
RUN wget https://github.com/twistedvisions/anaximander/archive/0.2.0-dev.1.zip -O anax.zip
RUN unzip anax.zip && rm -f anax.zip
RUN cp -r anaximander-0.2.0-dev.1/* . && rm -r anaximander-0.2.0-dev.1
RUN npm install --production

ADD config.json /anax/config.json

EXPOSE 8000

ENV NODE_ENV production
CMD ["npm", "start"]
