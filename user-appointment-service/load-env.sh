#!/bin/bash

# Load environment variables from .env file

echo "Loading environment variables from .env file..."

# set environment variables
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/pulseiq_db?currentSchema=pulseiq"
export SPRING_DATASOURCE_USERNAME="pulseiq_user"
export SPRING_DATASOURCE_PASSWORD="cse408"
export JWT_SECRET="w7Zz8g3kS0Hjb3YzF5k3jI2pK8VrTPCB2qLm+XhQz6M="
export SERVER_PORT="8085"
export SERVER_ADDRESS="0.0.0.0"
export JWT_EXPIRATION="86400000"
export FIREBASE_ENABLED="true"

#Firebase JSON (multi-line)
export FIREBASE_JSON='{"type": "service_account","project_id": "pulseiq-cse-408","private_key_id": "a43a71e214b0525f7a50c625bc1eb0c9ac936e67","private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDKj1yiH5GPco1J\nxoCAOtsZCRdT8zMlMw/spiNukaaZimI5lWCV4QyOwflUDUVWkE2Xl6NDuRUDAhBk\n77IV8h9n3QR2k9lbw1T4CGA2ske5hTUyVQp7v2exMsFQySuXOQB6T+Io78l+iW5q\nMzQpOCRUNKUOpILcscriDUm7StwFS8hgBgESovxL4yBSH78bRbRul+Nkzhw5bbbU\nD3bepXufTmLqywqB0SDmaiWKBEFBGiAgOa98mPyv1GJuLuuiT6Q+bARxv0E6FNIz\nKi+OEuKZECarSy8fMgK+QexeYLB3Ggmq/V5eZuL1PSo7Eymk12+FrR52uLBfEr6U\npRjPcCPNAgMBAAECggEALlN4V5nJtBl6R8euxuTvC/xAyhHifhz+BN0AWH7WL+Ju\n0YWg19ZnBVVGnRsF4yTQoh1rmQcAz7XOow8Q1yUPWrU5Gpd4zBxR2AIuYwQGFF9r\nSa4aXi/p2qRlgwDnR8ghHFgdvMgOeLKcvowkX1L4OAvsPfuQ9EFzSZzJYpzd0hXY\n3k/NT8VA9o8csnaqOSUR10qespsp1ZHBK3yycnNj4RFDeSiUjsnc8ZJiLtGbMOO+\nsBQ65WCJeoQrhI1uGkr2UqfREjbDj8N0wTWsnj8S3+exwzbfQDxVzvx1TAGHI01q\nC4uIk5WziDkEJwWQUz+GRRMiEtTJkTsFDpZdDztZQQKBgQD33Llk8gkRUxx5IJny\n77j+RXhrstKCU/9UEL3wQFM0yJTLP/FfYmlk96i8a5a2NAnPi5Taudn3yUoT3VBe\nSwuvrONRlAb6B/Odf4nfzCUu2eZhHxgrbeJ5jZvDgIXCzHOwv5COqpuVAa312bO4\noFYXz331KVOLaQG0MDwO2gOybQKBgQDRNd+wrE3VAqn0aOXIWPWxS5cuBsCF9cz1\n/IMm+CEqsSoE772V657oBEDa/qVk0WwbzqO9CPzibsQR7/73g26/KHcnZpmQYdMb\nvJyDpa8RjsQ4mTY1fKBu9WUShuNWdC55w8O2Cbe6pfcYKfiOPFmfkrPiuIe/7PHJ\ny3QwgY5a4QKBgQDtioPC0pMOH3CyRSRFRqksRrfZv08vyABzOHhPv9X+SB0RjP5u\nQ4puUUtNCG8vvz+HwGWwGV1js21jDD7xn0pb2n0guZTWGrjGwGwKJ0ObWwkHGx22\nwWDCzYvyGUIYJojZYz3O/IKOk0V80F8FGeRofVphknGWsdQINBHayeWxIQKBgQCR\ne8tQSqHdTPru8btI9UP1xMEeyqc7ANFFBhIWGVrHG2hDAoxuIungIoUPRSGy2Ec7\nlxkaLZPdynUinChL6uQqnnMtvRVw5/YsRZ75lVAG/6bITRL7Yu0V/CQLHC4fQq/H\nETGZ92wCqcMI1Lb6AlG4vAXH1dbgyl7hm0/zI0ThQQKBgAIrJH6+rw9Q9iIKxn6f\nAzrkyC7CNurvBR609edy+F9QdEdMPQSR6kjYZJv+VwejuCIE590DM9pWDvo5P/rS\nJ2wuiT+QHQOhe4PSudrEyGDgqov7fiOszu3B0w8H7oI2o/PUFgbU3NMTNhufpD57\n+/k2+c3D7FZIoJWN3hnwMtXU\n-----END PRIVATE KEY-----\n","client_email": "firebase-adminsdk-fbsvc@pulseiq-cse-408.iam.gserviceaccount.com","client_id": "102616960430723357387","auth_uri": "https://accounts.google.com/o/oauth2/auth","token_uri": "https://oauth2.googleapis.com/token","auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40pulseiq-cse-408.iam.gserviceaccount.com","universe_domain": "googleapis.com"}'

echo "environment variables loaded successfully!"
