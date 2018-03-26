'use strict'

const assert = require('assert')
const AWS = require('aws-sdk')

const client = new AWS.DynamoDB.DocumentClient()

const listMovements = (event, context, callback) => {
  const limit = event.Limit ? event.Limit : 10

  const params = {
    TableName: process.env.MOVEMENTS_TABLE,
    // TableName: 'madziki-movements',
    KeyConditionExpression: '#Owner = :Owner',
    ExpressionAttributeNames: {
      '#Owner': 'Owner'
    },
    ExpressionAttributeValues: {
      ':Owner': event.Owner
    },
    Limit: limit
  }

  if (event.Offset) {
    params.ExclusiveStartKey = event.Offset
  }

  client.query(params, (err, data) => {
    if (err) callback(err)
    else callback(null, data)
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
      callback(null, item)
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
      callback(null, data && data.Attributes ? data.Attributes : data)
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
      callback(null, data && data.Attributes ? data.Attributes : data)
    }
  })
}

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
        callback(null, data.Item)
      } else {
        callback()
      }
    }
  })
}

module.exports = {getMovement, postMovement, putMovement, deleteMovement, listMovements}
