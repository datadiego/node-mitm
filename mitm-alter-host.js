import { Proxy } from 'http-mitm-proxy'

const proxy = new Proxy()

proxy.onError((ctx, err) => {
  console.error('proxy error:', err)
})

proxy.onRequest((ctx, callback) => {
  const url = ctx.clientToProxyRequest.url
  const host = ctx.clientToProxyRequest.headers.host
  const method = ctx.clientToProxyRequest.method

  console.log('request:', { url, host, method })

  // Si el host es Google, redirigir a Reddit
  if (host === 'www.google.com') {
    console.log('🔄 Redirigiendo a Reddit')
    ctx.proxyToClientResponse.writeHead(302, {
      Location: 'https://www.reddit.com'
    })
    ctx.proxyToClientResponse.end()
    return
  }

  return callback()
})

console.log('Listening on 8081')
proxy.listen({ port: 8081 })
