import { Proxy } from 'http-mitm-proxy'

const proxy = new Proxy()

proxy.onError(function (ctx, err) {
  console.error('proxy error:', err)
})

proxy.onRequest(function (ctx, callback) {
  const url = ctx.clientToProxyRequest.url
  const method = ctx.clientToProxyRequest.method
  const statusCode = ctx.clientToProxyRequest.statusCode
  console.log('request:', {
    url,
    method,
    statusCode
  })
  console.log('request headers:', ctx.clientToProxyRequest.headers)
  console.log('request body:', ctx.clientToProxyRequest.body.toString())
  return callback()
})

console.log('begin listening on 8081')
proxy.listen({ port: 8081, host: '0.0.0.0' })
