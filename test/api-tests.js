const AWS = require('aws-sdk')
AWS.config.update({
  region: 'us-east-1'
})
const lambda = new AWS.Lambda()
const chai = require('chai')
const should = chai.should()
const handler = require('../index')

const DEBUG = false
const ENV = 'madziki-dev'
const OWNER = 'testuser'

const SYSTEM = {
  Name: 'Test System',
  Type: 'SYSTEM',
  Owner: OWNER,
  Description: 'This is the test system.',
  Details: '1. This is the first step\n1. This is the second step.'
}

const MOVEMENT = {
  Name: 'Test Movement',
  Type: 'Sweep',
  Owner: OWNER,
  Description: 'This is a test movement.',
  Details: '1. This is the first step.\n1. This is the second step.'
}

describe('api-tests', function () {
  before(function() {
    process.env.MOVEMENTS_TABLE=`${ENV}-movements`
  })

  after(function() {
    process.env.MOVEMENTS_TABLE=''
  })

  describe('#getMovement()', function() {
    beforeEach(function() {
      return insertItem(SYSTEM)
    })

    afterEach(function() {
      return deleteItem(SYSTEM)
    })

    it('should retrieve a movement by key', function(done) {
      invoke(`${ENV}-getMovement`, {Name: SYSTEM.Name, Owner: OWNER}, (err, payload) => {
        if (err) done(err)
        else {
          should.exist(payload.Name)
          payload.Name.should.equal(SYSTEM.Name)

          should.exist(payload.Type)
          payload.Type.should.equal(SYSTEM.Type)

          should.exist(payload.Owner)
          payload.Owner.should.equal(SYSTEM.Owner)

          should.exist(payload.Description)
          payload.Description.should.equal(SYSTEM.Description)

          should.exist(payload.Details)
          payload.Details.should.equal(SYSTEM.Details)

          should.exist(payload.Created)
          should.exist(payload.Updated)

          done()
        }
      })
    })

    it('should not retrieve a movement that does not exist', function(done) {
      invoke(`${ENV}-getMovement`, {Name: 'InvalidName', Owner: OWNER}, (err, payload) => {
        if (err) done(err)
        else {
          should.not.exist(payload)
          done()
        }
      })
    })

  })

  describe('#postMovement()', function () {
    afterEach(function() {
      return deleteItem(SYSTEM)
    })

    it('should create a new movement', function (done) {
      invoke(`${ENV}-postMovement`, SYSTEM, (err, payload) => {
        if (err) done(err)
        else {
          should.exist(payload.Name)
          payload.Name.should.equal(SYSTEM.Name)

          should.exist(payload.Owner)
          payload.Owner.should.equal(SYSTEM.Owner)

          should.exist(payload.Type)
          payload.Type.should.equal(SYSTEM.Type)

          should.exist(payload.Created)
          should.exist(payload.Updated)

          done()
        }
      })
    })

  })

  describe('#putMovement()', function() {
    beforeEach(function() {
      return insertItem(SYSTEM)
    })

    afterEach(function() {
      return deleteItem(SYSTEM)
    })

    it('should update an existing movement', function(done) {
      invoke(`${ENV}-putMovement`, SYSTEM, (err, payload) => {
        if (err) done(err)
        else {
          should.exist(payload.Updated)
          payload.Updated.should.not.equal(SYSTEM.Updated)

          done()
        }
      })
    })

  })

  describe('#deleteMovement()', function() {
    it('should not delete an invalid movement', function(done) {
      invoke(`${ENV}-deleteMovement`, {Name: 'InvalidName', Owner: 'InvalidOwner'}, (err, payload) => {
        if (err) done(err)
        else {
          Object.keys(payload).length.should.equal(0)
          done()
        }
      })
    })
  })

  describe('#listMovements()', function() {
    beforeEach(function() {
      const promises = []
      promises.push(insertItem(SYSTEM))
      promises.push(insertItem(MOVEMENT))
      return Promise.all(promises)
    })

    afterEach(function() {
      const promises = []
      promises.push(deleteItem(SYSTEM))
      promises.push(deleteItem(MOVEMENT))
      return Promise.all(promises)
    })

    it('should list all movements for an owner', function(done) {
      invoke(`${ENV}-listMovements`, {Owner: OWNER}, (err, payload) => {
        if (err) done(err)
        else {
          should.exist(payload.Count)
          payload.Count.should.equal(2)

          should.exist(payload.Items)
          payload.Items.length.should.equal(2)

          for (const item of payload.Items) {
            should.exist(item.Owner)
            item.Owner.should.equal(OWNER)
          }
          done()
        }
      })
    })

    it('should not find movements for an invalid user', function(done) {
      invoke(`${ENV}-listMovements`, {Owner: 'InvalidOwner'}, (err, payload) => {
        if (err) done(err)
        else {
          should.exist(payload.Count)
          payload.Count.should.equal(0)
          should.exist(payload.Items)
          payload.Items.length.should.equal(0)
          done()
        }
      })
    })

  })

})

function insertItem(item) {
  return new Promise( (resolve, reject) => {
    handler.postMovement(item, null, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

function deleteItem(item) {
  return new Promise( (resolve, reject) => {
    handler.deleteMovement(item, null, (err, data) => {
      if (err) reject(err)
      else resolve(null, data)
    })
  })
}

function invoke(functionName, payload = {}, callback) {
  const params = {
    FunctionName: functionName,
    InvocationType: "RequestResponse",
    LogType: "Tail",
    Payload: payload instanceof String ?  payload : JSON.stringify(payload)
  }
  lambda.invoke(params, function(err, data) {
    if (err) callback(err)
    else {
      should.exist(data)
      should.exist(data.StatusCode)
      data.StatusCode.should.equal(200)
      should.not.exist(data['errorMessage'])
      should.exist(data.Payload)

      if (DEBUG === true) {
        // Print the log.
        should.exist(data.LogResult)
        console.log('LogResult:')
        console.log(Buffer.from(data.LogResult, 'base64').toString())
        console.log('Payload:')
        console.log(data.Payload)
      }
      callback(null, JSON.parse(data.Payload))
    }
  })
}