const Promise = require('bluebird')
const chai = require('chai')
const should = chai.should()
const LambdaTester = require('lambda-tester')
const handler = require('../index')

const SYSTEM = {
  Name: 'Test System',
  Type: 'SYSTEM',
  Owner: 'testuser',
  Description: 'This is the test system.',
  Details: '1. This is the first step\n1. This is the second step.'
}

describe('api-tests', function () {
  before(function() {
    process.env.MOVEMENTS_TABLE='madziki-dev-movements'
  })

  after(function() {
    process.env.MOVEMENTS_TABLE=''
  })

  describe('#getMovement()', function() {
    beforeEach(function() {
      return insertSystem()
    })

    afterEach(function() {
      return deleteSystem()
    })

    it('should retrieve a movement by key', function() {
      return LambdaTester(handler.getMovement)
        .event(SYSTEM)
        .expectResult( data => {
          should.exist(data)

          should.exist(data.Name)
          data.Name.should.equal(SYSTEM.Name)

          should.exist(data.Type)
          data.Type.should.equal(SYSTEM.Type)

          should.exist(data.Owner)
          data.Owner.should.equal(SYSTEM.Owner)

          should.exist(data.Description)
          data.Description.should.equal(SYSTEM.Description)

          should.exist(data.Details)
          data.Details.should.equal(SYSTEM.Details)

          should.exist(data.Created)
          should.exist(data.Updated)
        })
    })
  })

  describe('#postMovement()', function () {
    afterEach(function() {
      return deleteSystem()
    })

    it('should create a new movement', function () {
      return LambdaTester(handler.postMovement)
        .event(SYSTEM)
        .expectResult( data => {
          should.exist(data)

          should.exist(data.Name)
          data.Name.should.equal(SYSTEM.Name)

          should.exist(data.Owner)
          data.Owner.should.equal(SYSTEM.Owner)

          should.exist(data.Type)
          data.Type.should.equal(SYSTEM.Type)

          should.exist(data.Created)
          should.exist(data.Updated)
        })
    })
  })

  describe('#updateMovement()', function() {
    beforeEach(function() {
      return insertSystem()
    })

    afterEach(function() {
      return deleteSystem()
    })

    it('should update an existing movement', function() {
      return LambdaTester(handler.putMovement)
        .event(SYSTEM)
        .expectResult( data => {
          should.exist(data)
          should.exist(data.Updated)
          data.Updated.should.not.equal(SYSTEM.Updated)
        })
    })
  })

  describe('#deleteMovement()', function() {
    it('should not delete an invalid movement', function() {
      return LambdaTester(handler.deleteMovement)
        .event({
          Name: 'InvalidName',
          Owner: 'InvalidOwner'
        })
        .expectResult( data => {
          should.exist(data)
        })
    })
  })
})

function insertSystem() {
  return Promise.fromCallback( callback => {
    handler.postMovement(SYSTEM, null, callback)
  })
}

function deleteSystem() {
  return Promise.fromCallback( callback => {
    handler.deleteMovement(SYSTEM, null, callback)
  }).then( data => {
    should.exist(data.Name)
    data.Name.should.equal(SYSTEM.Name)
  })
}