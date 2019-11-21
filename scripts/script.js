const video = document.getElementById('video')
const mode = document.getElementById('mode')
const change = document.getElementById('change')
const capture = document.getElementById('capture')
const canvas = document.getElementById('myCanvas')
var ctx = canvas.getContext('2d');

var interval = null
var curr_mode = "realtime"

video.height = window.innerHeight / 2
video.width = window.innerWidth / 2

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./public/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./public/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./public/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('./public/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}


mode.addEventListener('click', () => {
  console.log("da")
  video.pause()
  if (curr_mode == "realtime") {
    curr_mode = "image"
    document.getElementById("whichMode").innerHTML = "Image Capture Mode"
    clearInterval(interval)
    capture.disabled = false
  } else {
    curr_mode = "realtime"
    
    document.getElementById("whichMode").innerHTML = "Real Time Mode"
    capture.disabled = true;
  }
  video.play()
})

video.addEventListener('loadedmetadata', function() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
});

video.addEventListener('play', () => {
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  
  if (curr_mode == "realtime") {
    interval = setInterval(async () => {
      detect(canvas, displaySize)
    }, 100)
  }
})

// video.addEventListener('play', function() {
//   var $this = this; //cache
//   (function loop() {
//     if (!$this.paused && !$this.ended) {
//       ctx.drawImage($this, 0, 0);
//       setTimeout(loop, 1000 / 30); // drawing at 30fps
//     }
//   })();
// }, 100);

capture.addEventListener('click', () => {
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  detect(canvas, displaySize).then(response => {
    if (response != null) {
      connection.send(JSON.stringify({"emotion" : response}))
    }
  })
  
})

async function detect(displaySize) {
  const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
  const resizedDetections = faceapi.resizeResults(detections, displaySize)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  faceapi.draw.drawDetections(canvas, resizedDetections)
  faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
  faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  var table = document.getElementById("answer");
  let response = null
  table.innerHTML = ""
  if (detections.length == 0) {
    var row = table.insertRow(document.length);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    cell1.innerHTML = "No Face Found"
    let img = document.createElement("img")
    img.src = "./public/images/brain.svg"
    img.height = 30
    img.width = 30
    cell2.appendChild(img)
  }
  for (let i = 0; i < detections.length; i++) {
    let expressions = detections[i].expressions
    let max = -1
    let ans = "brain"
    Object.keys(expressions).forEach(function (key, index) {
      // key: the name of the object key
      // index: the ordinal position of the key within the object 
      if (max < expressions[key]) {
        ans = key
        max = expressions[key]
      }
    });
    if (i == 0) {
      response = ans
    }
    var row = table.insertRow(document.length);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    cell1.innerHTML = "Person" + (i + 1)
    cell2.innerHTML = ans
    let img = document.createElement("img")
    img.src = "./public/images/" + ans + ".svg"
    img.height = 30
    img.width = 30
    cell3.appendChild(img)

  }
  return response
}
