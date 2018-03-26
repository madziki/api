# Madziki API

## Installation

## Deploy a Stack

The following commands can be used in order to build a new stack.

```bash
# Deploy the dev stack.
make deploy
# Deploy the A stack.
make deploy-a
# Deploy the B stack.
make deploy-b
```

## Remove a Stack

The following commands can be used in order to remove a stack.
```bash
# Remove the dev stack.
make remove
# Remove the A stack.
make remove-a
# Remove the B stack.
make remove-b
```

## Testing

The following commands can be used in order to run tests against the dev stack.

```bash
# Run all the tests.
mocha
# Run a subset of tests.
mocha -g <pattern>
```

## ToDo

Get stuff done.

Project
- Add linting configuration.

API
- Implement and test the list movements API.
- Determine how to identify the current user.
- Add error checking to the server side so the client doesn't have to check.

Testing
- Validate the result values of the API calls.

Logging
- Add console logging to the code.

Local
- Create a local dynamodb to run against.
- Either run the required services locally or run everything in Docker.

## Lessons Learned

The following are a few items I came across while building this service.

### Lambda Error Handling

You can't rely on a 200 status code to determine whether the result is valid.  There are many errors that
can come back from Lambda API calls that result in errors. In these cases the callback error will be null and
the data payload will contain error contents rather than the expected payload.  You will need to parse the
payload first looking for errors either in your API's or the clients will have to perform this check.

https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html

### Local Stack

Local stack is a promising way to run AWS resources on your local computer for testing.  They have support for many
of the standard AWS services.  Unfortunately, at this point I found many inconsistencies when using local stack for 
testing.  I found myself changing code that ran fine in AWS in order to get it to run properly in local stack.  I
can see where somewhere down the road this project can be very useful.  I'll probably re-visit this in a few months.

https://github.com/localstack/localstack

### Lambda Testing

I originally started testing the Lambda services using lambda-tester.  This library seemed to work well for local
testing though for the amount of effort it fell short of just running the tests against the live dev services. If
you insist upon having tests that you can run locally then this package might be useful.  For my case I'd have to run
DynamoDB locally and or hit a live instance.

https://github.com/vandium-io/lambda-tester

The AWS Node.js SDK has a useful function for invoking a Lambda.

https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property

```javascript 1.6
/* This operation invokes a Lambda function */
 var params = {
  ClientContext: "MyApp", 
  FunctionName: "MyFunction", 
  InvocationType: "Event", 
  LogType: "Tail", 
  Payload: <Binary String>, 
  Qualifier: "1"
 };
 lambda.invoke(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else     console.log(data);           // successful response
   /*
   data = {
    FunctionError: "", 
    LogResult: "", 
    Payload: <Binary String>, 
    StatusCode: 123
   }
   */
 });
```

### Serverless Deployment

During development of this API I bounced back and forth between using AWS SAM and the Serverless framework.  Both
are pretty good and viable options though each seem to have their own unique pros and cons.

#### AWS SAM

https://docs.aws.amazon.com/lambda/latest/dg/serverless_app.html

##### From Amazon

##### AWS SAM Local

##### No Packaging

##### Native Cloud Formation

#### Serverless

Serverless is an open source toolkit for deploying and operating serverless architectures. It allows you to focus on 
your application, not your infrastructure.

https://serverless.com/

Here is the specification for the Serverless.yml file.

https://serverless.com/framework/docs/providers/aws/guide/serverless.yml/

##### Stages

Serverless has a concept of stages that allow you to easily manage your different environments.  I found it useful that
out of the box there was a pre-defined pattern for managing this.

https://serverless.com/framework/docs/providers/aws/cli-reference/package/#packaging-with-stage-and-region-options

Below is an example of deploying to the production stage using the Serverless CLI.

```bash
serverless package --stage production --region eu-central-1
```

##### Packaging

Serverless really made it easy to package Node.js Lambda code.  It automatically creates a zip file containing only
your required production resources.  Below is an example configuration in the serverless.yml file that will allow you
include only the index.js.

```yaml
package:
  exclude:
    - ./**
  include:
    - index.js
```

##### Cloud Formation-Like

Serverless allows you to manage much of your infrastructure in a Cloud Formation like syntax.  In many ways the syntax
improves upon Cloud Formation but there are bits and pieces that are not supported.  Overall, there are a lot of 
advantages but it also means you must know two different syntax, Cloud Formation and Serverless.