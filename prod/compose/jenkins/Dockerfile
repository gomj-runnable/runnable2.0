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

# 플러그인 사전 설치 (JCasC 적용에 configuration-as-code 필수)
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# JCasC 설정 위치 지정 + 설정 마법사 비활성화
COPY jenkins.casc.yaml /var/jenkins_home/casc.yaml
ENV CASC_JENKINS_CONFIG=/var/jenkins_home/casc.yaml
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
