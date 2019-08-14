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

            stage('GRP') {
                steps {
                    echo 'GRP'
                }
            }

        }
        stage('Test') {
            steps {
                echo 'Test'
            }
        }

        stage('Deploy') {
            input {
                message "Should we continue?"
                ok "Yes, we should."

            }
            steps {
                echo 'Test'
            }
        }
    }
}            
            
