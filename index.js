const { Requester, Validator } = require('external-adapter')

const customParams = {
  artist: true
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const artist = validator.validated.data.artist
  const url = `https://api.spotify.com/v1/artists/${artist}`

  const options = {
    url,
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`
    }
  }

  Requester.requestRetry(options)
    .then(response => {
      response.body.result = Requester.validateResult(response.body, ['popularity'])
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data)
  })
}

exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    })
  })
}

module.exports.createRequest = createRequest
