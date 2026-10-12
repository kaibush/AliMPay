;(function () {
  var root = document.documentElement
  var site = root.getAttribute('data-visora-site') || ''
  var base = root.getAttribute('data-visora-base') || ''
  if (!site || site.charAt(0) === '%' || !base || base.charAt(0) === '%') return
  var script = document.createElement('script')
  script.defer = true
  script.src = base.replace(/\/$/, '') + '/tracker.js'
  script.setAttribute('data-site', site)
  script.setAttribute('data-wait-for-user', 'true')
  document.head.appendChild(script)
})()
