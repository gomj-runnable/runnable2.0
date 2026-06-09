# =============================================================================
# Jenkins 이미지 — JCasC(Configuration as Code) 로 보안 설정 재현 (#181)
#
# 배경: bare jenkins/jenkins:lts 는 컨테이너 재생성 시 보안 설정이 유실되어
#       초기 설정 마법사가 재실행됨. JCasC + plugins.txt 로 보안 realm/권한/
#       CSRF 를 이미지에 박아 재현 가능하게 한다.
#
# 빌드/적용은 compose 의 jenkins.build 로 수행 (docker-compose.yml 참조).
# =============================================================================
FROM jenkins/jenkins:lts

# ── 빌드 툴체인 설치 (Jenkinsfile 이 컨테이너 안에서 실행) ──
# bare lts 는 Java 만 있어 node/pnpm 부재, 호스트 docker 바이너리는 macOS 라 Linux 컨테이너에서
# Exec format error. node20 + corepack(pnpm) + Linux docker-ce-cli 를 이미지에 굽는다.
# docker 는 마운트된 docker.sock 으로 호스트 데몬을 제어한다.
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && corepack enable \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

# 플러그인 사전 설치 (JCasC 적용에 configuration-as-code 필수)
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# JCasC 설정 위치 지정 + 설정 마법사 비활성화
# 주의: /var/jenkins_home 은 named volume 마운트 지점이라, 그 아래에 COPY 하면
# 런타임에 볼륨이 파일을 가려 JCasC 가 설정을 못 읽는다. 볼륨 밖 경로에 둔다.
COPY jenkins.casc.yaml /var/jenkins_conf/jenkins.yaml
ENV CASC_JENKINS_CONFIG=/var/jenkins_conf/jenkins.yaml
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
