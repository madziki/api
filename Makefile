
validate:
	aws cloudformation validate-template --template-body file://./serverless.yml

start-localstack:
	LAMBDA_EXECUTOR=docker localstack start --docker

#init:
#	mkdir -p dist

#clean:
#	rm -rf ./dist

#package: init
#	aws cloudformation package \
#		--template-file ./serverless.yml \
#		--output-template-file ./dist/output.yml \
#		--s3-bucket madziki-serverless \
#		--s3-prefix sam

#exec: init
#	aws cloudformation deploy \
#		--template-file ./dist/output.yml \
#		--stack-name madziki-dev

deploy:
#	aws cloudformation create-stack --stack-name madziki-dev --template-body file://./madziki.cfn.yml
#	aws cloudformation wait stack-create-complete --stack-name madziki-dev
	serverless deploy

update-list-movements:
#	serverless deploy --function skill --stage prod
	serverless deploy --function listMovements

list-movements-logs:
	serverless logs --function listMovements

remove:
	serverless remove

delete-dev:
	aws cloudformation delete-stack --stack-name madziki-dev
	aws cloudformation wait stack-delete-complete --stack-name madziki-dev

PHONY: validate init clean package exec dev delete-dev
