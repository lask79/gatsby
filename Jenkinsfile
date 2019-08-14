pipeline {
  agent any
  stages {
    stage('Build') {
      parallel {
        stage('GRP') {
          steps {
            echo 'GRP'
          }
        }
        stage('RuleTree') {
          steps {
            echo 'test'
          }
        }
      }
    }
    stage('Test') {
      steps {
        echo 'Test'
      }
    }
  }
}