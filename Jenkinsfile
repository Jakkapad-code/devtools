pipeline {
  agent { label 'petory-host' }
  options {
    disableConcurrentBuilds()
    timeout(time: 45, unit: 'MINUTES')
  }
  triggers { pollSCM('H/2 * * * *') }
  stages {
    stage('Install and verify') {
      steps {
        dir('petory') {
          sh '''
            set -eu
            node -e 'if (Number(process.versions.node.split(".")[0]) !== 22) { console.error("Node.js 22 is required"); process.exit(1); }'
            docker info >/dev/null
            npm ci
            npm audit --omit=dev --audit-level=high
            npm run build
          '''
        }
      }
    }
    stage('Integration and browser tests') {
      steps { sh 'sh petory/scripts/jenkins-integration.sh' }
    }
    stage('Build instructor image') {
      steps {
        dir('petory') {
          sh 'docker build --platform linux/amd64 --build-arg PETORY_SOURCE_REVISION="$(git rev-parse HEAD)" -f Dockerfile.instructor -t petory-jenkins-instructor:latest .'
        }
      }
    }
    stage('Deploy demo') {
      steps { sh 'sh petory/scripts/jenkins-deploy.sh' }
    }
  }
  post {
    always { archiveArtifacts artifacts: 'petory/test-results/*.png', allowEmptyArchive: true }
  }
}
