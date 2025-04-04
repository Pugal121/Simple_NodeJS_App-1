pipeline {
    agent any
    tools {
        nodejs 'NodeJs-1'
    }
    environment {
        SONAR_PROJECT_KEY = 'node-app'
        SONAR_SCANNER_HOME = tool 'SonarQubeScanner'
        AWS_REGION = 'us-east-1'
        ECR_REGISTRY = '241533155086.dkr.ecr.us-east-1.amazonaws.com'
        ECR_REPOSITORY = 'demo-repo'
        IMAGE_TAG = "v1.0.0"  // Versioning
        ECS_CLUSTER = "cluster-1"
        ECS_SERVICE = "demo-service"
    }

    stages {
        stage('Checkout Github') {
            steps {
                git branch: 'master', credentialsId: 'github-cred', url: 'https://github.com/Pugal121/Simple_NodeJS_App.git'
                sh 'ls -la'  // Debugging step to check the files in workspace
            }
        }

        stage('Install node dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'Sonar-token', variable: 'SONAR_TOKEN')]) {
                    withSonarQubeEnv('SonarQube') {
                        sh """
                        ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=http://localhost:9000 \
                        -Dsonar.login=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh """
                    docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
                    docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
                    """
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                echo "Running Trivy and generating a report..."
                sh """
                trivy image --format template --template "@/usr/local/share/trivy/templates/html.tpl" -o trivy-report.html $ECR_REGISTRY/$ECR_REPOSITORY:latest
                """
            }
        }

        stage('Publish Trivy Report') {
            steps {
                echo "Publishing Trivy report..."
                publishHTML target: [
                    reportName: 'Trivy Scan Report',
                    reportDir: '',
                    reportFiles: 'trivy-report.html',
                    keepAll: true
                ]
            }
        }

        stage('Login to AWS ECR') {
            steps {
                script {
                    withAWS(credentials: 'AWS-Credentials', region: "$AWS_REGION") {
                        sh """
                        aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
                        """
                    }
                }
            }
        }

        stage('Tag & Push to AWS ECR') {
            steps {
                script {
                    sh """
                    docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
                    docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
                    """
                }
            }
        }

        stage('Deploy to ECS EC2') {
            steps {
                script {
                    withAWS(credentials: 'AWS-Credentials', region: "$AWS_REGION") {
                        sh """
                        aws ecs update-service --cluster $ECS_CLUSTER \
                        --service $ECS_SERVICE \
                        --force-new-deployment
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment Successful! 🚀'
        }
        failure {
            echo 'Deployment failed. Check logs.'
        }
    }
}
