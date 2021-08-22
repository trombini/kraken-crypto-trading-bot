#!/bin/sh

set -x

AWS_ACCOUNT_ID=045015727085
REGION=eu-central-1
IMAGE=crypto-trading-bot-bot
PROFILE=azone
REPO=$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# TODO take version from package.json
#git reset --hard
npm version 'minor' -m "Bump version to %s"
#git push --follow-tags --set-upstream origin dddd
VERSION=$(node -p "require('./package.json').version")


# Login to AWS
echo "| Login to AWS"
aws ecr get-login-password --region $REGION --profile $PROFILE | docker login --username AWS --password-stdin $REPO

echo "| Build docker container"
docker build -t $IMAE:$VERSION --platform=linux/amd64 .

echo "| Push docker image to repository"
docker tag $IMAGE:$VERSION $REPO/$IMAGE:$VERSION
docker push $REPO/$IMAGE:$VERSION
