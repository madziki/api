'use strict'

const assert = require('assert')
const AWS = require('aws-sdk')

const client = new AWS.DynamoDB.DocumentClient()

const listMovements = (event, context, callback) => {
  const owner = event.pathParameters.owner

  if (!owner) {
    // Owner is required.
    callback("[BadRequest] Owner is a required field.'")
    return
  }

  const limit = event.Limit ? event.Limit : 10

  const params = {
    TableName: process.env.MOVEMENTS_TABLE,
    KeyConditionExpression: '#Owner = :Owner',
    ExpressionAttributeNames: {
      '#Owner': 'Owner'
    },
    ExpressionAttributeValues: {
      ':Owner': owner
    },
    Limit: limit
  }

  if (event.Offset) {
    params.ExclusiveStartKey = event.Offset
  }

  client.query(params, (err, data) => {
    if (err) callback(err)
    else {
      callback(null, {
        "statusCode": 200,
        "body": JSON.stringify(data, null, 2),
        "isBase64Encoded": false
      })
    }
  })
}

const postMovement = (event, context, callback) => {
  const now = new Date().toISOString()
  const item = {
    Name: event.Name,
    Type: event.Type,
    Owner: event.Owner,
    Description: event.Description,
    Details: event.Details,
    Created: now,
    Updated: now
  }
  const params = {
    TableName: process.env.MOVEMENTS_TABLE,
    Item: item
  }
  client.put(params, (err) => {
    if (err) {
      callback(err)
    } else {
      callback(null, {
        "statusCode": 200,
        "body": JSON.stringify(data, null, 2),
        "isBase64Encoded": false
      })
    }
  })
}

const putMovement = (event = {}, context, callback) => {
  assert(event.Name, '"event.name" should exist')
  assert(event.Owner, '"event.Owner" should exist')

  const params = {
    TableName: process.env.MOVEMENTS_TABLE,
    Key: {
      Name: event.Name,
      Owner: event.Owner
    },
    ExpressionAttributeNames: {
      '#Name': 'Name',
      '#Owner': 'Owner',
      '#Type': 'Type',
      '#Description': 'Description',
      '#Details': 'Details',
      '#Updated': 'Updated'
    },
    ExpressionAttributeValues: {
      ':Name': event.Name,
      ':Owner': event.Owner,
      ':Type': event.Type,
      ':Description': event.Description,
      ':Details': event.Details,
      ':Updated': new Date().toISOString()
    },
    UpdateExpression: 'SET #Description = :Description, #Details = :Details, #Type = :Type, #Updated = :Updated',
    ConditionExpression: '#Name = :Name and #Owner = :Owner',
    ReturnValues: 'ALL_NEW'
  }
  client.update(params, (err, data) => {
    if (err) {
      callback(err)
    } else {
      callback(null, {
        "statusCode": 200,
        "body": JSON.stringify(data && data.Attributes ? data.Attributes : data, null, 2),
        "isBase64Encoded": false
      })
    }
  })
}

const deleteMovement = (event, context, callback) => {
  const params = {
    TableName: process.env.MOVEMENTS_TABLE,
    Key: {
      Name: event.Name,
      Owner: event.Owner
    },
    ReturnValues: 'ALL_OLD'
  }
  return client.delete(params, (err, data) => {
    if (err) {
      callback(err)
    } else {
      callback(null, {
        "statusCode": 200,
        "body": JSON.stringify(data && data.Attributes ? data.Attributes : data, null, 2),
        "isBase64Encoded": false
      })
    }
  })
}

/**
 * TODO: Pull the request parameters from the request parameters.
 * TODO: Add a 404 if the data can't be found.
 * TODO: Add a 400 if an id isn't supplied.
 * @param event
 * @param context
 * @param callback
 * @returns {*}
 */
const getMovement = (event, context, callback) => {
  const params = {
    TableName: process.env.MOVEMENTS_TABLE,
    Key: {
      Name: event.Name,
      Owner: event.Owner
    }
  }
  return client.get(params, (err, data) => {
    if (err) {
      callback(err)
    } else {
      if (data.Item) {
        callback(null, {
          "statusCode": 200,
          "body": JSON.stringify(data.Item),
          "isBase64Encoded": false
        })
      } else {
        callback(`[NotFound] No movement found for Owner: ${event.Owner} and Name: ${event.Name}`)
      }
    }
  })
}

module.exports = {getMovement, postMovement, putMovement, deleteMovement, listMovements}
