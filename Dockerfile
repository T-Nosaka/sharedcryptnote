FROM ubuntu:24.04
EXPOSE 3000/tcp
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Tokyo
RUN apt -y update;apt -y upgrade; apt install -y language-pack-ja-base language-pack-ja curl git
RUN <<EOF
cat <<- _DOC_ > /root/build.sh
#!/bin/bash
. $HOME/.nvm/nvm.sh
nvm install --lts
npm install npm
npm install -g npm@11.5.2
npm run build
_DOC_
EOF
RUN <<EOF
cd ~
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
git clone https://github.com/T-Nosaka/sharedcryptnote.git
EOF
COPY .env.local /root/sharedcryptnote/.
RUN chmod a+x /root/build.sh
WORKDIR /root/sharedcryptnote
RUN /root/build.sh
RUN <<EOF
cat <<- _DOC_ > /root/start.sh
#!/bin/bash
. $HOME/.nvm/nvm.sh
npm run start
_DOC_
EOF
RUN chmod a+x /root/start.sh
