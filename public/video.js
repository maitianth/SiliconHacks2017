var peer = null;
var mediapromise = null;
function display(remote) {
  var video = document.querySelector('video');
  video.srcObject = remote;
  video.onloadedmetadata = function(e) {video.play();}
}

function call() {
  var first = false;
  if(incall)
  {
    console.log("already in call")
    return;
  }
  console.log("prepare for call")
  mediapromise = navigator.mediaDevices.getUserMedia({audio : true, video : true});
  mediapromise.then(function(stream) {
    stream.getVideoTracks()[0].enabled = !$('#novideo').checked;
    stream.getAudioTracks()[0].enabled = !$('#mute').checked;
    peer = new SimplePeer({ initiator: true, stream: stream })
    $('#call').attr('disabled', 'disabled')
    $('#call').text("calling...")
    peer.on('signal', function(data) {
      if(!first)
      {
        socket.emit('call', JSON.stringify(data, null, 4))
        first = true;
      }
      peer.signal(data)
    })

    peer.on('connect', function(){
      $('#call').text('end call')
      $('#call').removeAttr('disabled')
      incall = true
    })
    peer.on('error', function(err) {
      console.log(err);
      $('#call').attr('disabled', 'disabled')
      $('#call').text("can't call")
    })


    peer.on('stream', function(remote) {
      display(remote);
    })
    $('body').on('click', '#call', function(e) {
      peer.destroy(true)
    })


    peer.on('close', function() {
      $('#call').text("call ended")
      $('#call').attr('disabled', 'disabled')
      incall = false
      mediapromise = null
    })
    $('#novideo').change(function(e) {
      stream.getVideoTracks()[0].enabled = !this.checked;
    })
    $('#mute').change(function(e) {
      stream.getAudioTracks()[0].enabled = !this.checked;
    })
  })
}

function answer(data) {
  if(incall)
  {
    console.log("already in call")
    return;
  }
  console.log('receiving call')
  mediapromise = navigator.mediaDevices.getUserMedia({audio : true, video : true});
  mediapromise.then(function(stream) {
    stream.getVideoTracks()[0].enabled = !$('#novideo').checked;
    stream.getAudioTracks()[0].enabled = !$('#mute').checked;
    // Answer the call, providing our MediaStream
    peer = new SimplePeer({ stream: stream })
    peer.signal(data)
    $('#call').attr('disabled', 'disabled')
    $('#call').text("answering call...")
    peer.on('signal', function(data) {
      peer.signal(data)
    })

    peer.on('connect', function(){
      $('#call').text('end call')
      $('#call').removeAttr('disabled')
      incall = true
    })
    peer.on('error', function(err) {
      console.log(err);
      $('#call').attr('disabled', 'disabled')
      $('#call').text("can't receive")
    })


    peer.on('stream', function(remote) {
      display(remote);
    })
    $('body').on('click', '#call', function(e) {
      peer.destroy(true)
    })


    peer.on('close', function() {
      $('#call').text("call ended")
      $('#call').attr('disabled', 'disabled')
      incall = false
      mediapromise = null
    })
    $('#novideo').change(function(e) {
      stream.getVideoTracks()[0].enabled = !this.checked;
    })
    $('#mute').change(function(e) {
      stream.getAudioTracks()[0].enabled = !this.checked;
    })
  })
}