import https from 'node:https'
import fs from 'node:fs'

// --- 설정 ---
const GHCR_IMAGE = process.env.GHCR_IMAGE || 'ghcr.io/all4land-runnable/runnable2.0'
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '60', 10) * 1000 // 기본 60초
const NAMESPACE = process.env.TARGET_NAMESPACE || 'runnable'
const DEPLOYMENT = process.env.TARGET_DEPLOYMENT || 'runnable-app'
const CONTAINER_NAME = process.env.TARGET_CONTAINER || 'app'
const IMAGE_TAG = process.env.IMAGE_TAG || 'latest'

// K8s in-cluster config
const K8S_HOST = process.env.KUBERNETES_SERVICE_HOST
const K8S_PORT = process.env.KUBERNETES_SERVICE_PORT
const TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token'
const CA_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt'

let lastDigest = null

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

// ghcr.io PAT (private 패키지 인증용)
const GHCR_TOKEN = process.env.GHCR_TOKEN || ''

// ghcr.io에서 manifest digest 조회
function fetchDigest() {
  return new Promise((resolve, reject) => {
    const repo = GHCR_IMAGE.replace('ghcr.io/', '')

    // PAT가 있으면 Basic auth, 없으면 anonymous token
    if (GHCR_TOKEN) {
      fetchDigestWithAuth(repo, resolve, reject)
    } else {
      fetchDigestAnonymous(repo, resolve, reject)
    }
  })
}

function fetchDigestWithAuth(repo, resolve, reject) {
  const credentials = Buffer.from(`USERNAME:${GHCR_TOKEN}`).toString('base64')

  const options = {
    hostname: 'ghcr.io',
    path: `/v2/${repo}/manifests/${IMAGE_TAG}`,
    method: 'HEAD',
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.v2+json, application/vnd.docker.distribution.manifest.list.v2+json',
    },
  }

  const req = https.request(options, (res) => {
    res.resume()
    const digest = res.headers['docker-content-digest']
    if (res.statusCode === 200 && digest) {
      resolve(digest)
    } else {
      reject(new Error(`Manifest HEAD ${res.statusCode}, digest: ${digest || 'missing'}`))
    }
  })

  req.on('error', reject)
  req.end()
}

function fetchDigestAnonymous(repo, resolve, reject) {
  const tokenUrl = `https://ghcr.io/token?scope=repository:${repo}:pull`

  httpsGet(tokenUrl, (err, tokenBody) => {
    if (err) return reject(new Error(`Token fetch failed: ${err.message}`))

    let token
    try {
      token = JSON.parse(tokenBody).token
    } catch (e) {
      return reject(new Error(`Token parse failed: ${tokenBody}`))
    }

    const options = {
      hostname: 'ghcr.io',
      path: `/v2/${repo}/manifests/${IMAGE_TAG}`,
      method: 'HEAD',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.v2+json, application/vnd.docker.distribution.manifest.list.v2+json',
      },
    }

    const req = https.request(options, (res) => {
      res.resume()
      const digest = res.headers['docker-content-digest']
      if (res.statusCode === 200 && digest) {
        resolve(digest)
      } else {
        reject(new Error(`Manifest HEAD ${res.statusCode}, digest: ${digest || 'missing'}`))
      }
    })

    req.on('error', reject)
    req.end()
  })
}

function httpsGet(url, callback) {
  const parsed = new URL(url)
  https
    .get(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: { Accept: 'application/json' },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => callback(null, Buffer.concat(chunks).toString()))
      }
    )
    .on('error', (err) => callback(err))
}

function patchDeployment() {
  return new Promise((resolve, reject) => {
    const token = fs.readFileSync(TOKEN_PATH, 'utf8')
    const ca = fs.readFileSync(CA_PATH)

    const fullImage = `${GHCR_IMAGE}:${IMAGE_TAG}`
    const patch = {
      spec: {
        template: {
          metadata: {
            annotations: {
              'deployer.runnable/restart': new Date().toISOString(),
            },
          },
          spec: {
            containers: [
              {
                name: CONTAINER_NAME,
                image: fullImage,
              },
            ],
          },
        },
      },
    }

    const body = JSON.stringify(patch)
    const options = {
      hostname: K8S_HOST,
      port: K8S_PORT,
      path: `/apis/apps/v1/namespaces/${NAMESPACE}/deployments/${DEPLOYMENT}`,
      method: 'PATCH',
      ca,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/strategic-merge-patch+json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString()
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode })
        } else {
          reject(new Error(`K8s API ${res.statusCode}: ${responseBody}`))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function poll() {
  try {
    const digest = await fetchDigest()

    if (lastDigest === null) {
      lastDigest = digest
      log(`Initial digest: ${digest}`)
      return
    }

    if (digest !== lastDigest) {
      log(`New image detected! ${lastDigest} → ${digest}`)
      lastDigest = digest

      await patchDeployment()
      log(`Deployment ${NAMESPACE}/${DEPLOYMENT} updated to ${GHCR_IMAGE}:${IMAGE_TAG}`)
    } else {
      log(`No change (digest: ${digest.substring(0, 20)}...)`)
    }
  } catch (err) {
    log(`Poll error: ${err.message}`)
  }
}

// --- 시작 ---
log(`Image watcher started`)
log(`  image: ${GHCR_IMAGE}:${IMAGE_TAG}`)
log(`  poll interval: ${POLL_INTERVAL / 1000}s`)
log(`  target: ${NAMESPACE}/${DEPLOYMENT}`)

poll()
setInterval(poll, POLL_INTERVAL)

// HTTP health check (liveness/readiness probe용)
import http from 'node:http'

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', lastDigest, image: `${GHCR_IMAGE}:${IMAGE_TAG}` }))
    return
  }
  res.writeHead(404)
  res.end()
})

healthServer.listen(3001, () => {
  log(`Health endpoint on :3001/health`)
})
